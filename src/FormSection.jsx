var React = require('react');
var Joi = require('joi');

var FormSection = React.createClass({
    // Cant be used until we get 0.14.x
    contextTypes: {
        joiForm: React.PropTypes.object
    },

    makeObject(list, values) {
        if (!list) return {};
        var result = {};
        for (var i = 0, l = list.length; i < l; i++) {
            result[list[i]] = values[i];
        }
        return result;
    },
    render() {
        var context = this.context.joiForm;
        var fields;

        if(this.props.tag === undefined) fields = context.schema; // if no tag is passed as prop, sections display everything

        else if(context.schema && this.props.tag) {
            fields = context.schema.filter((field) => {
                return field._tags.indexOf(this.props.tag) !== -1;
            });
            if(fields.length < 1) fields = null; // if tag does not match tag(s) in schema, render nothing
        }

        return (
            <div>
                {fields && fields.map((fieldSchema) => {
                    if(!fieldSchema.isJoi) {
                        throw new Error('An array of Joi objects is what we expect for joi-react-forms.');
                    }

                    if(!fieldSchema._meta.name && !fieldSchema._flags.label) {
                        throw new Error('All joi-react-form elements MUST have a label or a name meta key/value');
                    }

                    if(fieldSchema._meta.length > 0) {
                        fieldSchema._meta = this._merge(fieldSchema._meta);
                    }

                    var multiField = fieldSchema._meta.multi;
                    const schemaForValids = multiField ? fieldSchema._inner.items[0] : fieldSchema;
                    if (schemaForValids._meta.length > 0) {
                        schemaForValids._meta = this._merge(schemaForValids._meta);
                    }

                    var fieldComponent = fieldSchema._meta.component || 'text';
                    var fieldName = fieldSchema._meta.name || this._camelize(fieldSchema._settings.language.label);
                    var optionNames, optionValues;

                    if(fieldComponent === 'select' || fieldComponent === 'select2') {
                        if(!schemaForValids._valids || !schemaForValids._valids._set || !schemaForValids._valids._set.length === 0) {
                            return console.error(`${fieldName} is a ${fieldComponent} ${multiField ? 'with multiple values' : ''} component but no 'valid' params are provided, field is ignored`);
                        }
                    }

                    if(schemaForValids._valids && schemaForValids._valids._set && schemaForValids._valids._set.length > 0) {
                        optionValues = schemaForValids._meta.names || schemaForValids._valids._set;
                        optionNames = schemaForValids._valids._set;
                    }

                    var options = {
                        ...fieldSchema._meta,
                        required: fieldSchema._flags.presence === 'required',
                        name: fieldName,
                        label: fieldSchema._settings.language.label,
                        key: fieldName,
                        allowed: optionValues,
                        default: fieldSchema._flags ? fieldSchema._flags.default : undefined
                    };

                    switch(fieldComponent) {
                        case 'text':
                            options.placeholder = fieldSchema._examples[0] || undefined;
                        break;
                        case 'select':
                        case 'select2':
                            options.enums = this.makeObject(optionNames, optionValues);
                        break;
                        case 'checkbox':

                        break;
                        case 'textArea':

                        break;
                        case 'file':

                        break;
                        case 'form':
                            options.formType = fieldSchema._type; // should be either object or array
                            const schemaProvider = options.type === 'object'
                              ? fieldSchema._inner.children // we get an array of [key, schema] as children for object items
                              : fieldSchema._inner.items[0]._inner.children // we get an array of [key, schema] from the first valid item type of the array - that should be an object

                            options.schema = schemaProvider.map(c => c.schema);
                        break;
                    }

                    if(!context[`${fieldComponent}Component`]) {
                        console.error('[JoiForm Error] The requested input type of ' + fieldComponent + ' does not have a defined component');
                        return (
                            <span>Input type {fieldComponent} does not have a defined component type</span>
                        )
                    }

                    return context[`${fieldComponent}Component`](context.getErrors(fieldName), context.getValue(fieldName), options, {
                        onChange: this.__onChange,
                        onSelect2Search: this.__onSelect2Search,
                        onAutocompleteSearch: this.__onAutocompleteSearch,
                        onFocus: this.__onFocus,
                        onBlur: this.__onBlur
                    })
                })}
            </div>
        );
    },
    _camelize(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return index == 0 ? match.toLowerCase() : match.toUpperCase();
        });
    },
    _merge(objects = []) {
        var obj = {};
        objects.forEach((iObj) => {
            Object.keys(iObj).forEach((key) => {
                obj[key] = iObj[key];
            });
        });
        return obj;
    },
    __onChange(e) {
        if(e.preventDefault) {
            e.preventDefault();
        }

        var context = this.context.joiForm;

        var name = e.target.name;
        var index = e.target.index;
        var value = e.target.value;
        var files = e.dataTransfer ? e.dataTransfer.files : e.target.files;

        if(context.onChange) {
            var change = {};
            var pos = index >= 0 ? '[' + index + ']' : '';
            change[name+pos] = files || value;

            context.onChange(e, change);
        }
    },
    __onSelect2Search(e) {
        if(e.preventDefault) {
            e.preventDefault();
        }

        var context = this.context.joiForm;

        if(context.onSelect2Search) {
            var change = {};
            change[e.target.name] = e.target.value;

            context.onSelect2Search(e, change);
        }
    },
    __onAutocompleteSearch (searchText, dataSource) {
        var context = this.context.joiForm;
        if(context.onAutocompleteSearch) {
            context.onAutocompleteSearch(searchText, dataSource);
        }
    },
    __onFocus(e) {
        var context = this.context.joiForm;

        if(context.onFocus) {
            context.onFocus(e);
        }
    },
    __onBlur(e) {
        var context = this.context.joiForm;

        if(context.onBlur) {
            context.onBlur(e);
        }
    }
});

module.exports = FormSection;
