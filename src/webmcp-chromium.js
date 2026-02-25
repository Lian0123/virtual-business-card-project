/**
 * Chromium-based WebMCP Integration for Virtual Business Card
 *
 * Implements the navigator.modelContext.registerTool() / unregisterTool() API
 * as defined by the Chromium WebMCP specification.
 *
 * Reference: https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/react-flightsearch
 *
 * Each tool provides:
 *   - name: unique tool identifier
 *   - description: human-readable description
 *   - inputSchema: JSON Schema for tool input
 *   - outputSchema: JSON Schema for tool output
 *   - execute: async function that performs the action
 *   - annotations: metadata hints (e.g. readOnlyHint)
 */

(function (global) {
  'use strict';

  // ─── Track registered tools ────────────────────────────────────────────────
  const registeredToolNames = new Set();
  const mirroredTools = {};
  var usingNativeModelContext = false;
  var nativeRegisterRetryTimer = null;
  var nativeRegisterRetryAttempts = 0;
  var MAX_NATIVE_REGISTER_RETRIES = 6;

  function mirrorRegister(toolDef) {
    if (!toolDef || !toolDef.name) return;
    mirroredTools[toolDef.name] = toolDef;
  }

  function mirrorUnregister(toolName) {
    if (!toolName) return;
    delete mirroredTools[toolName];
  }

  function listMirroredTools() {
    return Object.keys(mirroredTools).map(function (name) {
      var t = mirroredTools[name];
      return {
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        outputSchema: t.outputSchema,
        annotations: t.annotations
      };
    });
  }

  function ensureModelContextTestingBridge() {
    var existing = navigator.modelContextTesting;
    if (existing && typeof existing.listTools === 'function') return;

    var testingBridge = {
      _isPolyfill: true,
      listTools: function () {
        return Promise.resolve(listMirroredTools());
      },
      callTool: function (name, input) {
        var modelContext = navigator.modelContext;
        if (modelContext && typeof modelContext.callTool === 'function') {
          return Promise.resolve(modelContext.callTool(name, input || {}));
        }
        var tool = mirroredTools[name];
        if (!tool) return Promise.reject(new Error('Unknown tool: ' + name));
        return Promise.resolve(tool.execute(input || {}));
      }
    };

    try {
      Object.defineProperty(navigator, 'modelContextTesting', {
        configurable: true,
        writable: true,
        value: testingBridge
      });
    } catch (e1) {
      try {
        navigator.modelContextTesting = testingBridge;
      } catch (e2) {
        // Ignore if browser prevents assignment.
      }
    }
  }

  // ─── dispatchAndWait helper ────────────────────────────────────────────────
  // Dispatches a CustomEvent and waits for a completion acknowledgement.
  // The React app listens for tool events and fires `tool-completion-<requestId>`
  // once the state update is applied.
  function dispatchAndWait(eventName, detail, successMessage, timeoutMs) {
    if (successMessage === undefined) successMessage = 'Action completed successfully';
    if (timeoutMs === undefined) timeoutMs = 5000;

    return new Promise(function (resolve, reject) {
      var requestId = Math.random().toString(36).substring(2, 15);
      var completionEventName = 'tool-completion-' + requestId;

      var timeoutId = setTimeout(function () {
        global.removeEventListener(completionEventName, handleCompletion);
        reject(new Error('Timed out waiting for UI to update (requestId: ' + requestId + ')'));
      }, timeoutMs);

      function handleCompletion(evt) {
        clearTimeout(timeoutId);
        global.removeEventListener(completionEventName, handleCompletion);
        // If the completion event carries result data, include it
        var result = (evt && evt.detail) ? evt.detail : {};
        if (result && result.error !== undefined && result.error !== null) {
          var errMessage = typeof result.error === 'string'
            ? result.error
            : (result.error.message || 'Tool execution failed');
          reject(new Error(errMessage));
          return;
        }
        resolve(result.data !== undefined ? result.data : successMessage);
      }

      global.addEventListener(completionEventName, handleCompletion);

      // Dispatch the tool event with requestId so the handler can fire completion
      var event = new CustomEvent(eventName, {
        detail: Object.assign({}, detail, { requestId: requestId })
      });
      global.dispatchEvent(event);
    });
  }

  // ─── Tool Definitions ─────────────────────────────────────────────────────

  // 1. card.getState — Read-only: returns current app state
  var getStateTool = {
    name: 'card.getState',
    description: 'Returns the current state of the virtual business card application, including card type, language, theme, all card data fields, QR content, and WebMCP status.',
    inputSchema: {},
    outputSchema: {
      type: 'object',
      properties: {
        cardType:   { type: 'string', description: 'Current card type (main, qr, custom)' },
        lang:       { type: 'string', description: 'Current locale code' },
        theme:      { type: 'string', description: 'Current theme (light or dark)' },
        cardData:   { type: 'object', description: 'All card data fields' },
        qrContent:  { type: 'string', description: 'Current QR code content' },
        webMcp:     { type: 'object', description: 'WebMCP status info' }
      }
    },
    execute: function () {
      return dispatchAndWait('webmcp-tool-getState', {}, null, 3000);
    },
    annotations: {
      readOnlyHint: 'true'
    }
  };

  // 2. card.setType — Switch card type
  var setTypeTool = {
    name: 'card.setType',
    description: 'Sets the card type to one of: "main" (standard business card), "qr" (QR code card), or "custom" (fully customizable card).',
    inputSchema: {
      type: 'object',
      properties: {
        cardType: {
          type: 'string',
          enum: ['main', 'qr', 'custom'],
          description: 'The card type to switch to.'
        }
      },
      required: ['cardType']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-setType', { cardType: params.cardType },
        'Card type changed to ' + params.cardType + '.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 3. card.setLanguage — Change UI language
  var setLanguageTool = {
    name: 'card.setLanguage',
    description: 'Sets the UI language/locale for the application. Supports locale codes like "zh-TW", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE", "es-ES", etc.',
    inputSchema: {
      type: 'object',
      properties: {
        lang: {
          type: 'string',
          description: 'BCP 47 locale code (e.g. "en-US", "zh-TW", "ja-JP")'
        }
      },
      required: ['lang']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-setLanguage', { lang: params.lang },
        'Language changed to ' + params.lang + '.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 4. card.setTheme — Toggle light/dark theme
  var setThemeTool = {
    name: 'card.setTheme',
    description: 'Sets the application theme to "light" or "dark" mode.',
    inputSchema: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['light', 'dark'],
          description: 'The theme to apply.'
        }
      },
      required: ['theme']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-setTheme', { theme: params.theme },
        'Theme changed to ' + params.theme + '.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 5. card.updateField — Update a single card data field
  var updateFieldTool = {
    name: 'card.updateField',
    description: 'Updates a single field on the business card. Common fields: name, title, company, email, phone, address, website, country, bgGradientColor1, bgGradientColor2, textColor, accentColor.',
    inputSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          description: 'The card data field name to update.'
        },
        value: {
          description: 'The new value for the field.'
        }
      },
      required: ['field', 'value']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-updateField',
        { field: params.field, value: params.value },
        'Field "' + params.field + '" updated successfully.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 6. card.updateFields — Batch-update multiple card data fields
  var updateFieldsTool = {
    name: 'card.updateFields',
    description: 'Updates multiple card data fields at once. Pass an object where keys are field names and values are the new values.',
    inputSchema: {
      type: 'object',
      properties: {
        updates: {
          type: 'object',
          description: 'Object mapping field names to new values. e.g. { "name": "Alex", "title": "Engineer" }'
        }
      },
      required: ['updates']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      var keys = Object.keys(params.updates || {});
      return dispatchAndWait('webmcp-tool-updateFields',
        { updates: params.updates },
        keys.length + ' field(s) updated successfully.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 7. card.updateLayout — Adjust layout-related fields
  var updateLayoutTool = {
    name: 'card.updateLayout',
    description: 'Updates layout-related card fields such as fontSize, borderRadiusOuter, borderRadiusInner, shadowBlur, padding, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        updates: {
          type: 'object',
          description: 'Object mapping layout field names to new values. e.g. { "fontSize": 16, "borderRadiusOuter": 18 }'
        }
      },
      required: ['updates']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-updateLayout',
        { updates: params.updates },
        'Layout updated successfully.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 8. card.setQrContent — Set QR code content
  var setQrContentTool = {
    name: 'card.setQrContent',
    description: 'Sets the content (URL or text) encoded in the QR code on the card.',
    inputSchema: {
      type: 'object',
      properties: {
        value: {
          type: 'string',
          description: 'The content/URL to encode in the QR code.'
        }
      },
      required: ['value']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-setQrContent',
        { value: params.value },
        'QR content updated.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 9. card.applyTemplate — Apply a design template
  var applyTemplateTool = {
    name: 'card.applyTemplate',
    description: 'Applies a predefined design template to the card. Available templates include "professional", "creative", "minimal", etc.',
    inputSchema: {
      type: 'object',
      properties: {
        templateName: {
          type: 'string',
          description: 'The name of the template to apply.'
        }
      },
      required: ['templateName']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-applyTemplate',
        { templateName: params.templateName },
        'Template "' + params.templateName + '" applied.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 10. card.setBackgroundImage — Set custom background image
  var setBackgroundImageTool = {
    name: 'card.setBackgroundImage',
    description: 'Sets the background image of the card from a URL. The card type should be "custom" to display background images.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to use as card background.',
          format: 'uri'
        }
      },
      required: ['imageUrl']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-setBackgroundImage',
        { imageUrl: params.imageUrl },
        'Background image set.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 11. card.export — Export card to various formats
  var exportTool = {
    name: 'card.export',
    description: 'Exports the business card in the specified format. Supported formats: "png", "jpg", "webp" (image), "html" (standalone HTML file), "vcf" (vCard contact file).',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['png', 'jpg', 'webp', 'html', 'vcf'],
          description: 'The export format.'
        }
      },
      required: ['format']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message with export format'
    },
    execute: function (params) {
      var format = params.format || 'png';
      return dispatchAndWait('webmcp-tool-export',
        { format: format },
        'Card exported as ' + format + '.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 12. card.simulateAction — Simulate a user interaction
  var simulateActionTool = {
    name: 'card.simulateAction',
    description: 'Simulates a user interaction on the card UI. Supports "click" action with targets like "export.png", "export.jpg", "export.webp", "export.html", "export.vcf", "animation.replay", "animation.toggle". Also supports "input" action to remotely fill a field.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['click', 'input'],
          description: 'The type of action to simulate.'
        },
        target: {
          type: 'string',
          description: 'The target element or field for the action.'
        },
        value: {
          description: 'The value to input (only for "input" action).'
        }
      },
      required: ['action', 'target']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message describing what was simulated'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-simulateAction',
        { action: params.action, target: params.target, value: params.value },
        'Simulated ' + params.action + ' on "' + params.target + '".');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // 13. card.setState — Batch-set top-level and card data state
  var setStateTool = {
    name: 'card.setState',
    description: 'Applies a partial state patch to the application. Can update top-level properties (cardType, lang, theme, qrContent) and nested cardData fields simultaneously.',
    inputSchema: {
      type: 'object',
      properties: {
        statePatch: {
          type: 'object',
          description: 'Partial state to merge. Top-level keys: cardType, lang, theme, qrContent, selectedTemplate, customImage, textStickers, cardData (object).',
          properties: {
            cardType:         { type: 'string', enum: ['main', 'qr', 'custom'] },
            lang:             { type: 'string' },
            theme:            { type: 'string', enum: ['light', 'dark'] },
            qrContent:        { type: 'string' },
            selectedTemplate: { type: 'string' },
            customImage:      { type: 'string' },
            textStickers:     { type: 'array' },
            cardData:         { type: 'object' }
          }
        }
      },
      required: ['statePatch']
    },
    outputSchema: {
      type: 'string',
      description: 'Confirmation message'
    },
    execute: function (params) {
      return dispatchAndWait('webmcp-tool-setState',
        { statePatch: params.statePatch },
        'State patch applied.');
    },
    annotations: {
      readOnlyHint: 'false'
    }
  };

  // ─── All tools array ───────────────────────────────────────────────────────
  var ALL_TOOLS = [
    getStateTool,
    setTypeTool,
    setLanguageTool,
    setThemeTool,
    updateFieldTool,
    updateFieldsTool,
    updateLayoutTool,
    setQrContentTool,
    applyTemplateTool,
    setBackgroundImageTool,
    exportTool,
    simulateActionTool,
    setStateTool
  ];

  // ─── Registration Functions ────────────────────────────────────────────────

  /**
   * Check whether navigator.modelContext is a real native Chromium API
   * (not our own polyfill). A polyfill will have our _isPolyfill marker.
   */
  function isNativeModelContext(ctx) {
    return ctx &&
           typeof ctx.registerTool === 'function' &&
           !ctx._isPolyfill;
  }

  /**
   * Register all Virtual Card tools with navigator.modelContext.
   * If the native Chromium modelContext API is available, uses registerTool().
   * Otherwise, provides a polyfill modelContext with the same interface.
   */
  function registerAllTools() {
    ensureModelContextTestingBridge();
    var modelContext = navigator.modelContext;

    if (isNativeModelContext(modelContext)) {
      // Keep native path when available (same direction as react-flightsearch).
      // If registration fails transiently, retry instead of downgrading to polyfill.
      var failedCount = 0;
      ALL_TOOLS.forEach(function (tool) {
        if (!registeredToolNames.has(tool.name)) {
          try {
            modelContext.registerTool(tool);
            registeredToolNames.add(tool.name);
            mirrorRegister(tool);
            console.log('[WebMCP-Chromium] Registered tool:', tool.name);
          } catch (err) {
            console.warn('[WebMCP-Chromium] registerTool failed for', tool.name, ':', err.message || err);
            failedCount += 1;
          }
        }
      });

      usingNativeModelContext = true;

      if (failedCount === 0) {
        nativeRegisterRetryAttempts = 0;
        if (nativeRegisterRetryTimer) {
          clearTimeout(nativeRegisterRetryTimer);
          nativeRegisterRetryTimer = null;
        }
      } else if (nativeRegisterRetryAttempts < MAX_NATIVE_REGISTER_RETRIES && !nativeRegisterRetryTimer) {
        nativeRegisterRetryAttempts += 1;
        nativeRegisterRetryTimer = setTimeout(function () {
          nativeRegisterRetryTimer = null;
          registerAllTools();
        }, 800);
      }

      if (registeredToolNames.size > 0) {
        console.log('[WebMCP-Chromium] All tools registered via native modelContext.');
      }
      return;
    }

    // Polyfill path
    usingNativeModelContext = false;
    console.log('[WebMCP-Chromium] Installing polyfill modelContext.');
    installPolyfill();
  }

  /**
   * Unregister all Virtual Card tools from navigator.modelContext.
   */
  function unregisterAllTools() {
    if (nativeRegisterRetryTimer) {
      clearTimeout(nativeRegisterRetryTimer);
      nativeRegisterRetryTimer = null;
    }
    nativeRegisterRetryAttempts = 0;

    var modelContext = navigator.modelContext;
    if (!modelContext || typeof modelContext.unregisterTool !== 'function') return;

    ALL_TOOLS.forEach(function (tool) {
      if (registeredToolNames.has(tool.name)) {
        try {
          modelContext.unregisterTool(tool.name);
        } catch (_) { /* ignore */ }
        registeredToolNames.delete(tool.name);
        mirrorUnregister(tool.name);
      }
    });
    usingNativeModelContext = false;
    console.log('[WebMCP-Chromium] All tools unregistered.');
  }

  // ─── Polyfill ──────────────────────────────────────────────────────────────
  // When the native Chromium modelContext is not available, provide a compatible
  // polyfill that supports registerTool/unregisterTool + backward-compatible
  // listTools/callTool interface.

  function installPolyfill() {
    var toolRegistry = {};

    var polyfill = {
      _isPolyfill: true,
      // Chromium-spec methods
      registerTool: function (toolDef) {
        toolRegistry[toolDef.name] = toolDef;
        mirrorRegister(toolDef);
      },
      unregisterTool: function (name) {
        delete toolRegistry[name];
        mirrorUnregister(name);
      },
      // Also expose list + call for backward compatibility
      listTools: function () {
        return Object.keys(toolRegistry).map(function (name) {
          var t = toolRegistry[name];
          return {
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            outputSchema: t.outputSchema,
            annotations: t.annotations
          };
        });
      },
      callTool: function (name, input) {
        var tool = toolRegistry[name];
        if (!tool) return Promise.reject(new Error('Unknown tool: ' + name));
        return Promise.resolve(tool.execute(input || {}));
      }
    };

    try {
      Object.defineProperty(navigator, 'modelContext', {
        configurable: true,
        writable: true,
        value: polyfill
      });
    } catch (e1) {
      try {
        navigator.modelContext = polyfill;
      } catch (e2) {
        // navigator.modelContext is non-configurable & non-writable (e.g. frozen by extension)
        // Merge polyfill methods onto the existing object if possible
        console.warn('[WebMCP-Polyfill] Cannot override navigator.modelContext, merging onto existing.', e2.message);
        var existing = navigator.modelContext;
        if (existing && typeof existing === 'object') {
          ['registerTool', 'unregisterTool', 'listTools', 'callTool'].forEach(function (key) {
            try { existing[key] = polyfill[key]; } catch (_) { /* skip */ }
          });
          try { existing._isPolyfill = true; } catch (_) { /* skip */ }
        }
      }
    }

    // Register all tools into the polyfill
    ALL_TOOLS.forEach(function (tool) {
      polyfill.registerTool(tool);
      registeredToolNames.add(tool.name);
    });
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  global.VirtualCardWebMCP = {
    tools: ALL_TOOLS,
    registerAll: registerAllTools,
    unregisterAll: unregisterAllTools,
    dispatchAndWait: dispatchAndWait,
    get isNative() { return usingNativeModelContext; }
  };

})(window);
