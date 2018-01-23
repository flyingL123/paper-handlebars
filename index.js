'use strict';

const _ = require('lodash');
const HandlebarsV3 = require('handlebars');
const HandlebarsV4 = require('@bigcommerce/handlebars-v4');
const helpers = require('./helpers');

const AppError = require('./lib/appError');
class CompileError extends AppError {};          // Error compiling template
class FormatError extends AppError {};           // Error restoring precompiled template
class RenderError extends AppError {};           // Error rendering template
class DecoratorError extends AppError {};        // Error applying decorator
class TemplateNotFoundError extends AppError {}; // Template not registered

const handlebarsOptions = {
    preventIndent: true
};

// HandlebarsRenderer implements the interface Paper requires for its
// rendering needs, and does so with Handlebars.
class HandlebarsRenderer {
    // Add static accessor to reference custom errors
    static get errors() {
        return {
            CompileError,
            FormatError,
            RenderError,
            DecoratorError,
            TemplateNotFoundError,
        };
    }

    /**
    * Constructor
    *
    * @param {Object} siteSettings - Global site settings, passed to helpers
    * @param {Object} themeSettings - Theme settings (configuration), passed to helpers
    * @param {String} hbVersion - Which version of handlebars to use. One of ['v3', 'v4'] - defaults to 'v3'.
    */
    constructor(siteSettings, themeSettings, hbVersion) {
        // Figure out which version of Handlebars to use.
        switch(hbVersion) {
            case 'v4':
                this.handlebars = HandlebarsV4.create();
                break;
            case 'v3':
            default:
                this.handlebars = HandlebarsV3.create();
                break;
        }

        this._translator = null;
        this._decorators = [];
        this._contentRegions = {};

        // Build global context for helpers
        this.helperContext = {
            siteSettings: siteSettings || {},
            themeSettings: themeSettings || {},
            handlebars: this.handlebars,
            getTranslator: this.getTranslator.bind(this),
            getContent: this.getContent.bind(this),
            storage: {}, // global storage used by helpers to keep state
        };

        // Register helpers with Handlebars
        helpers.forEach(spec => {
            this.handlebars.registerHelper(spec.name, spec.factory(this.helperContext));
        });
    }

    /**
     * Set the paper.Translator instance used to translate strings in helpers.
     *
     * @param {Translator} A paper.Translator instance used to translate strings in helpers
     */
    setTranslator(translator) {
        this._translator = translator;
    };

    /**
     * Get the paper.Translator instance used to translate strings in helpers.
     */
    getTranslator() {
        return this._translator;
    };

    /**
     * Add templates to the active set of partials. The templates can either be raw
     * template strings, or the result coming from the preProcessor function.
     *
     * @param {Object} A set of templates to register with handlebars
     */
    addTemplates(templates) {
        _.each(templates, (template, path) => {
            // Don't do this work twice, first one wins.
            if (typeof this.handlebars.partials[path] !== 'undefined') {
                return;
            }

            // Check if it is a precompiled template
            try {
                template = this._tryRestoringPrecompiled(template);
            } catch(e) {
                throw new FormatError(e.message);
            }

            // Register it with handlebars
            this.handlebars.registerPartial(path, template);
        });
    };

    _tryRestoringPrecompiled(precompiled) {
        // Let's analyze the string to make sure it at least looks
        // something like a handlebars precompiled template. It should
        // be a string representation of an object containing a `main`
        // function and a `compiler` array. We do this because the next
        // step is a potentially dangerous eval.
        const re = /.*"compiler"\w*:\w*\[.*"main"\w*:\w*function/;
        if (!re.test(precompiled)) {
            // This is not a valid precompiled template, so this is
            // a raw template that can be registered directly.
            return precompiled;
        }

        // We need to take the string representation and turn it into a
        // valid JavaScript object. eval is evil, but necessary in this case.
        let template;
        eval(`template = ${precompiled}`);

        // Take the precompiled object and get the actual function out of it,
        // after first testing for runtime version compatibility.
        return this.handlebars.template(template);
    }

    /**
     * Detect whether a given template has been loaded.
     */
    isTemplateLoaded(path) {
        return typeof this.handlebars.partials[path] !== 'undefined';
    }

    /**
     * Return a function that performs any preprocessing we want to do on the templates.
     * In our case, run them through the Handlebars precompiler. This returns a string
     * representation of an object understood by Handlebars to be a precompiled template.
     */
    getPreProcessor() {
        return templates => {
            const processed = {};
            _.each(templates, (template, path) => {
                try {
                    processed[path] = this.handlebars.precompile(template, handlebarsOptions);
                } catch(e) {
                    throw new CompileError(e.message, { path });
                }
            });
            return processed;
        };
    }

    /**
     * Add a decorator to be applied at render time.
     *
     * @param {Function} decorator
     */
    addDecorator(decorator) {
        this._decorators.push(decorator);
    };

    /**
     * Add content regions to be used by the `region` helper.
     *
     * @param {Object} Regions with widgets
     */
    addContent(regions) {
        this._contentRegions = regions;
    };

    /**
     * Get content regions.
     *
     * @param {Object} Regions with widgets
     */
    getContent() {
        return this._contentRegions;
    };

    /**
     * Render a template with the given context
     *
     * @param {String} path
     * @param {Object} context
     * @return {String}
     * @throws [TemplateNotFoundError|RenderError|DecoratorError]
     */
    render(path, context) {
        context = context || {};

        // Add some data to the context
        context.template = path;
        if (this._translator) {
            context.locale_name = this._translator.getLocale();
        }

        // Look up the template
        const template = this.handlebars.partials[path];
        if (typeof template === 'undefined') {
            throw new TemplateNotFoundError(`template not found: ${path}`);
        }

        // Render the template
        let result;
        try {
            result = template(context);
        } catch(e) {
            throw new RenderError(e.message);
        }

        // Apply decorators
        try {
            _.each(this._decorators, fn => {
                result = fn(result);
            });
        } catch(e) {
            throw new DecoratorError(e.message);
        }

        return result;
    };

    /**
     * Renders a string with the given context
     *
     * @param  {String} template
     * @param  {Object} context
     * @return {String}
     * @throws [CompileError|RenderError]
     */
    renderString(template, context) {
        context = context || {};

        // Compile the template
        try {
            template = this.handlebars.compile(template);
        } catch(e) {
            throw new CompileError(e.message);
        }

        // Render the result
        let result;
        try {
            result = template(context);
        } catch(e) {
            throw new RenderError(e.message);
        }

        return result;
    }
}

module.exports = HandlebarsRenderer;
