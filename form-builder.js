(function($) {
    $.extend($.fn, {
        validate: function(options) {
            if (!this.length) {
                if (options && options.debug && window.console) {
                    console.warn("Nothing selected, can't validate, returning nothing.");
                }
                return;
            }
            var validator = $.data(this[0], "validator");
            if (validator) {
                return validator;
            }
            this.attr("novalidate", "novalidate");
            validator = new $.validator(options, this[0]);
            $.data(this[0], "validator", validator);
            if (validator.settings.onsubmit) {
                this.validateDelegate(":submit", "click", function(event) {
                    if (validator.settings.submitHandler) {
                        validator.submitButton = event.target;
                    }
                    if ($(event.target).hasClass("cancel")) {
                        validator.cancelSubmit = true;
                    }
                });
                this.submit(function(event) {
                    if (validator.settings.debug) {
                        event.preventDefault();
                    }
                    function handle() {
                        var hidden;
                        if (validator.settings.submitHandler) {
                            if (validator.submitButton) {
                                hidden = $("<input type='hidden'/>").attr("name", validator.submitButton.name).val(validator.submitButton.value).appendTo(validator.currentForm);
                            }
                            validator.settings.submitHandler.call(validator, validator.currentForm, event);
                            if (validator.submitButton) {
                                hidden.remove();
                            }
                            return false;
                        }
                        return true;
                    }
                    if (validator.cancelSubmit) {
                        validator.cancelSubmit = false;
                        return handle();
                    }
                    if (validator.form()) {
                        if (validator.pendingRequest) {
                            validator.formSubmitted = true;
                            return false;
                        }
                        return handle();
                    } else {
                        validator.focusInvalid();
                        return false;
                    }
                });
            }
            return validator;
        },
        valid: function() {
            if ($(this[0]).is("form")) {
                return this.validate().form();
            } else {
                var valid = true;
                var validator = $(this[0].form).validate();
                this.each(function() {
                    valid &= validator.element(this);
                });
                return valid;
            }
        },
        removeAttrs: function(attributes) {
            var result = {}, $element = this;
            $.each(attributes.split(/\s/), function(index, value) {
                result[value] = $element.attr(value);
                $element.removeAttr(value);
            });
            return result;
        },
        rules: function(command, argument) {
            var element = this[0];
            if (command) {
                var settings = $.data(element.form, "validator").settings;
                var staticRules = settings.rules;
                var existingRules = $.validator.staticRules(element);
                switch (command) {
                  case "add":
                    $.extend(existingRules, $.validator.normalizeRule(argument));
                    staticRules[element.name] = existingRules;
                    if (argument.messages) {
                        settings.messages[element.name] = $.extend(settings.messages[element.name], argument.messages);
                    }
                    break;

                  case "remove":
                    if (!argument) {
                        delete staticRules[element.name];
                        return existingRules;
                    }
                    var filtered = {};
                    $.each(argument.split(/\s/), function(index, method) {
                        filtered[method] = existingRules[method];
                        delete existingRules[method];
                    });
                    return filtered;
                }
            }
            var data = $.validator.normalizeRules($.extend({}, $.validator.classRules(element), $.validator.attributeRules(element), $.validator.dataRules(element), $.validator.staticRules(element)), element);
            if (data.required) {
                var param = data.required;
                delete data.required;
                data = $.extend({
                    required: param
                }, data);
            }
            return data;
        }
    });
    $.extend($.expr[":"], {
        blank: function(a) {
            return !$.trim("" + a.value);
        },
        filled: function(a) {
            return !!$.trim("" + a.value);
        },
        unchecked: function(a) {
            return !a.checked;
        }
    });
    $.validator = function(options, form) {
        this.settings = $.extend(true, {}, $.validator.defaults, options);
        this.currentForm = form;
        this.init();
    };
    $.validator.format = function(source, params) {
        if (arguments.length === 1) {
            return function() {
                var args = $.makeArray(arguments);
                args.unshift(source);
                return $.validator.format.apply(this, args);
            };
        }
        if (arguments.length > 2 && params.constructor !== Array) {
            params = $.makeArray(arguments).slice(1);
        }
        if (params.constructor !== Array) {
            params = [ params ];
        }
        $.each(params, function(i, n) {
            source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function() {
                return n;
            });
        });
        return source;
    };
    $.extend($.validator, {
        defaults: {
            messages: {},
            groups: {},
            rules: {},
            errorClass: "error",
            validClass: "valid",
            errorElement: "label",
            focusInvalid: true,
            errorContainer: $([]),
            errorLabelContainer: $([]),
            onsubmit: true,
            ignore: ":hidden",
            ignoreTitle: false,
            onfocusin: function(element, event) {
                this.lastActive = element;
                if (this.settings.focusCleanup && !this.blockFocusCleanup) {
                    if (this.settings.unhighlight) {
                        this.settings.unhighlight.call(this, element, this.settings.errorClass, this.settings.validClass);
                    }
                    this.addWrapper(this.errorsFor(element)).hide();
                }
            },
            onfocusout: function(element, event) {
                if (!this.checkable(element) && (element.name in this.submitted || !this.optional(element))) {
                    this.element(element);
                }
            },
            onkeyup: function(element, event) {
                if (event.which === 9 && this.elementValue(element) === "") {
                    return;
                } else if (element.name in this.submitted || element === this.lastElement) {
                    this.element(element);
                }
            },
            onclick: function(element, event) {
                if (element.name in this.submitted) {
                    this.element(element);
                } else if (element.parentNode.name in this.submitted) {
                    this.element(element.parentNode);
                }
            },
            highlight: function(element, errorClass, validClass) {
                if (element.type === "radio") {
                    this.findByName(element.name).addClass(errorClass).removeClass(validClass);
                } else {
                    $(element).addClass(errorClass).removeClass(validClass);
                }
            },
            unhighlight: function(element, errorClass, validClass) {
                if (element.type === "radio") {
                    this.findByName(element.name).removeClass(errorClass).addClass(validClass);
                } else {
                    $(element).removeClass(errorClass).addClass(validClass);
                }
            }
        },
        setDefaults: function(settings) {
            $.extend($.validator.defaults, settings);
        },
        messages: {
            required: "This field is required.",
            remote: "Please fix this field.",
            email: "Please enter a valid email address.",
            url: "Please enter a valid URL.",
            date: "Please enter a valid date.",
            dateISO: "Please enter a valid date (ISO).",
            number: "Please enter a valid number.",
            digits: "Please enter only digits.",
            creditcard: "Please enter a valid credit card number.",
            equalTo: "Please enter the same value again.",
            maxlength: $.validator.format("Please enter no more than {0} characters."),
            minlength: $.validator.format("Please enter at least {0} characters."),
            rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
            range: $.validator.format("Please enter a value between {0} and {1}."),
            max: $.validator.format("Please enter a value less than or equal to {0}."),
            min: $.validator.format("Please enter a value greater than or equal to {0}.")
        },
        autoCreateRanges: false,
        prototype: {
            init: function() {
                this.labelContainer = $(this.settings.errorLabelContainer);
                this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
                this.containers = $(this.settings.errorContainer).add(this.settings.errorLabelContainer);
                this.submitted = {};
                this.valueCache = {};
                this.pendingRequest = 0;
                this.pending = {};
                this.invalid = {};
                this.reset();
                var groups = this.groups = {};
                $.each(this.settings.groups, function(key, value) {
                    if (typeof value === "string") {
                        value = value.split(/\s/);
                    }
                    $.each(value, function(index, name) {
                        groups[name] = key;
                    });
                });
                var rules = this.settings.rules;
                $.each(rules, function(key, value) {
                    rules[key] = $.validator.normalizeRule(value);
                });
                function delegate(event) {
                    var validator = $.data(this[0].form, "validator"), eventType = "on" + event.type.replace(/^validate/, "");
                    if (validator.settings[eventType]) {
                        validator.settings[eventType].call(validator, this[0], event);
                    }
                }
                $(this.currentForm).validateDelegate(":text, [type='password'], [type='file'], select, textarea, " + "[type='number'], [type='search'] ,[type='tel'], [type='url'], " + "[type='email'], [type='datetime'], [type='date'], [type='month'], " + "[type='week'], [type='time'], [type='datetime-local'], " + "[type='range'], [type='color'] ", "focusin focusout keyup", delegate).validateDelegate("[type='radio'], [type='checkbox'], select, option", "click change ifChanged", delegate);
                if (this.settings.invalidHandler) {
                    $(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler);
                }
            },
            form: function() {
                this.checkForm();
                $.extend(this.submitted, this.errorMap);
                this.invalid = $.extend({}, this.errorMap);
                if (!this.valid()) {
                    $(this.currentForm).triggerHandler("invalid-form", [ this ]);
                }
                this.showErrors();
                return this.valid();
            },
            checkForm: function() {
                this.prepareForm();
                for (var i = 0, elements = this.currentElements = this.elements(); elements[i]; i++) {
                    this.check(elements[i]);
                }
                return this.valid();
            },
            element: function(element) {
                element = this.validationTargetFor(this.clean(element));
                this.lastElement = element;
                this.prepareElement(element);
                this.currentElements = $(element);
                var result = this.check(element) !== false;
                if (result) {
                    delete this.invalid[element.name];
                } else {
                    this.invalid[element.name] = true;
                }
                if (!this.numberOfInvalids()) {
                    this.toHide = this.toHide.add(this.containers);
                }
                this.showErrors();
                return result;
            },
            showErrors: function(errors) {
                if (errors) {
                    $.extend(this.errorMap, errors);
                    this.errorList = [];
                    for (var name in errors) {
                        this.errorList.push({
                            message: errors[name],
                            element: this.findByName(name)[0]
                        });
                    }
                    this.successList = $.grep(this.successList, function(element) {
                        return !(element.name in errors);
                    });
                }
                if (this.settings.showErrors) {
                    this.settings.showErrors.call(this, this.errorMap, this.errorList);
                } else {
                    this.defaultShowErrors();
                }
            },
            resetForm: function() {
                if ($.fn.resetForm) {
                    $(this.currentForm).resetForm();
                }
                this.submitted = {};
                this.lastElement = null;
                this.prepareForm();
                this.hideErrors();
                this.elements().removeClass(this.settings.errorClass).removeData("previousValue");
            },
            numberOfInvalids: function() {
                return this.objectLength(this.invalid);
            },
            objectLength: function(obj) {
                var count = 0;
                for (var i in obj) {
                    count++;
                }
                return count;
            },
            hideErrors: function() {
                this.addWrapper(this.toHide).hide();
            },
            valid: function() {
                return this.size() === 0;
            },
            size: function() {
                return this.errorList.length;
            },
            focusInvalid: function() {
                if (this.settings.focusInvalid) {
                    try {
                        $(this.findLastActive() || this.errorList.length && this.errorList[0].element || []).filter(":visible").focus().trigger("focusin");
                    } catch (e) {}
                }
            },
            findLastActive: function() {
                var lastActive = this.lastActive;
                return lastActive && $.grep(this.errorList, function(n) {
                    return n.element.name === lastActive.name;
                }).length === 1 && lastActive;
            },
            elements: function() {
                var validator = this, rulesCache = {};
                return $(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, [disabled]").not(this.settings.ignore).filter(function() {
                    if (!this.name && validator.settings.debug && window.console) {
                        console.error("%o has no name assigned", this);
                    }
                    if (this.name in rulesCache || !validator.objectLength($(this).rules())) {
                        return false;
                    }
                    rulesCache[this.name] = true;
                    return true;
                });
            },
            clean: function(selector) {
                return $(selector)[0];
            },
            errors: function() {
                var errorClass = this.settings.errorClass.replace(" ", ".");
                return $(this.settings.errorElement + "." + errorClass, this.errorContext);
            },
            reset: function() {
                this.successList = [];
                this.errorList = [];
                this.errorMap = {};
                this.toShow = $([]);
                this.toHide = $([]);
                this.currentElements = $([]);
            },
            prepareForm: function() {
                this.reset();
                this.toHide = this.errors().add(this.containers);
            },
            prepareElement: function(element) {
                this.reset();
                this.toHide = this.errorsFor(element);
            },
            elementValue: function(element) {
                var type = $(element).attr("type"), val = $(element).val();
                if (type === "radio" || type === "checkbox") {
                    return $("input[name='" + $(element).attr("name") + "']:checked").val();
                }
                if (typeof val === "string") {
                    return val.replace(/\r/g, "");
                }
                return val;
            },
            check: function(element) {
                element = this.validationTargetFor(this.clean(element));
                var rules = $(element).rules();
                var dependencyMismatch = false;
                var val = this.elementValue(element);
                var result;
                for (var method in rules) {
                    var rule = {
                        method: method,
                        parameters: rules[method]
                    };
                    try {
                        result = $.validator.methods[method].call(this, val, element, rule.parameters);
                        if (result === "dependency-mismatch") {
                            dependencyMismatch = true;
                            continue;
                        }
                        dependencyMismatch = false;
                        if (result === "pending") {
                            this.toHide = this.toHide.not(this.errorsFor(element));
                            return;
                        }
                        if (!result) {
                            this.formatAndAdd(element, rule);
                            return false;
                        }
                    } catch (e) {
                        if (this.settings.debug && window.console) {
                            console.log("Exception occured when checking element " + element.id + ", check the '" + rule.method + "' method.", e);
                        }
                        throw e;
                    }
                }
                if (dependencyMismatch) {
                    return;
                }
                if (this.objectLength(rules)) {
                    this.successList.push(element);
                }
                return true;
            },
            customDataMessage: function(element, method) {
                return $(element).data("msg-" + method.toLowerCase()) || element.attributes && $(element).attr("data-msg-" + method.toLowerCase());
            },
            customMessage: function(name, method) {
                var m = this.settings.messages[name];
                return m && (m.constructor === String ? m : m[method]);
            },
            findDefined: function() {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] !== undefined) {
                        return arguments[i];
                    }
                }
                return undefined;
            },
            defaultMessage: function(element, method) {
                return this.findDefined(this.customMessage(element.name, method), this.customDataMessage(element, method), !this.settings.ignoreTitle && element.title || undefined, $.validator.messages[method], "<strong>Warning: No message defined for " + element.name + "</strong>");
            },
            formatAndAdd: function(element, rule) {
                var message = this.defaultMessage(element, rule.method), theregex = /\$?\{(\d+)\}/g;
                if (typeof message === "function") {
                    message = message.call(this, rule.parameters, element);
                } else if (theregex.test(message)) {
                    message = $.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
                }
                this.errorList.push({
                    message: message,
                    element: element
                });
                this.errorMap[element.name] = message;
                this.submitted[element.name] = message;
            },
            addWrapper: function(toToggle) {
                if (this.settings.wrapper) {
                    toToggle = toToggle.add(toToggle.parent(this.settings.wrapper));
                }
                return toToggle;
            },
            defaultShowErrors: function() {
                var i, elements;
                for (i = 0; this.errorList[i]; i++) {
                    var error = this.errorList[i];
                    if (this.settings.highlight) {
                        this.settings.highlight.call(this, error.element, this.settings.errorClass, this.settings.validClass);
                    }
                    this.showLabel(error.element, error.message);
                }
                if (this.errorList.length) {
                    this.toShow = this.toShow.add(this.containers);
                }
                if (this.settings.success) {
                    for (i = 0; this.successList[i]; i++) {
                        this.showLabel(this.successList[i]);
                    }
                }
                if (this.settings.unhighlight) {
                    for (i = 0, elements = this.validElements(); elements[i]; i++) {
                        this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, this.settings.validClass);
                    }
                }
                this.toHide = this.toHide.not(this.toShow);
                this.hideErrors();
                this.addWrapper(this.toShow).show();
            },
            validElements: function() {
                return this.currentElements.not(this.invalidElements());
            },
            invalidElements: function() {
                return $(this.errorList).map(function() {
                    return this.element;
                });
            },
            showLabel: function(element, message) {
                var label = this.errorsFor(element);
                if (label.length) {
                    label.removeClass(this.settings.validClass).addClass(this.settings.errorClass);
                    label.html(message);
                    if (this.settings.errorPlacement) {
                        this.settings.errorPlacement(label, $(element));
                    }
                } else {
                    label = $("<" + this.settings.errorElement + ">").attr("for", this.idOrName(element)).addClass(this.settings.errorClass).html(message || "");
                    if (this.settings.wrapper) {
                        label = label.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
                    }
                    if (!this.labelContainer.append(label).length) {
                        if (this.settings.errorPlacement) {
                            this.settings.errorPlacement(label, $(element));
                        } else {
                            label.insertAfter(element);
                        }
                    }
                }
                if (!message && this.settings.success) {
                    label.text("");
                    if (typeof this.settings.success === "string") {
                        label.addClass(this.settings.success);
                    } else {
                        this.settings.success(label, element);
                    }
                }
                this.toShow = this.toShow.add(label);
            },
            errorsFor: function(element) {
                var name = this.idOrName(element);
                return this.errors().filter(function() {
                    return $(this).attr("for") === name;
                });
            },
            idOrName: function(element) {
                return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
            },
            validationTargetFor: function(element) {
                if (this.checkable(element)) {
                    element = this.findByName(element.name).not(this.settings.ignore)[0];
                }
                return element;
            },
            checkable: function(element) {
                return /radio|checkbox/i.test(element.type);
            },
            findByName: function(name) {
                return $(this.currentForm).find("[name='" + name + "']");
            },
            getLength: function(value, element) {
                switch (element.nodeName.toLowerCase()) {
                  case "select":
                    return $("option:selected", element).length;

                  case "input":
                    if (this.checkable(element)) {
                        return this.findByName(element.name).filter(":checked").length;
                    }
                }
                return value.length;
            },
            depend: function(param, element) {
                return this.dependTypes[typeof param] ? this.dependTypes[typeof param](param, element) : true;
            },
            dependTypes: {
                "boolean": function(param, element) {
                    return param;
                },
                string: function(param, element) {
                    return !!$(param, element.form).length;
                },
                "function": function(param, element) {
                    return param(element);
                }
            },
            optional: function(element) {
                var val = this.elementValue(element);
                return !$.validator.methods.required.call(this, val, element) && "dependency-mismatch";
            },
            startRequest: function(element) {
                if (!this.pending[element.name]) {
                    this.pendingRequest++;
                    this.pending[element.name] = true;
                }
            },
            stopRequest: function(element, valid) {
                this.pendingRequest--;
                if (this.pendingRequest < 0) {
                    this.pendingRequest = 0;
                }
                delete this.pending[element.name];
                if (valid && this.pendingRequest === 0 && this.formSubmitted && this.form()) {
                    $(this.currentForm).submit();
                    this.formSubmitted = false;
                } else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
                    $(this.currentForm).triggerHandler("invalid-form", [ this ]);
                    this.formSubmitted = false;
                }
            },
            previousValue: function(element) {
                return $.data(element, "previousValue") || $.data(element, "previousValue", {
                    old: null,
                    valid: true,
                    message: this.defaultMessage(element, "remote")
                });
            }
        },
        classRuleSettings: {
            required: {
                required: true
            },
            email: {
                email: true
            },
            url: {
                url: true
            },
            date: {
                date: true
            },
            dateISO: {
                dateISO: true
            },
            number: {
                number: true
            },
            digits: {
                digits: true
            },
            creditcard: {
                creditcard: true
            }
        },
        addClassRules: function(className, rules) {
            if (className.constructor === String) {
                this.classRuleSettings[className] = rules;
            } else {
                $.extend(this.classRuleSettings, className);
            }
        },
        classRules: function(element) {
            var rules = {};
            var classes = $(element).attr("class");
            if (classes) {
                $.each(classes.split(" "), function() {
                    if (this in $.validator.classRuleSettings) {
                        $.extend(rules, $.validator.classRuleSettings[this]);
                    }
                });
            }
            return rules;
        },
        attributeRules: function(element) {
            var rules = {};
            var $element = $(element);
            for (var method in $.validator.methods) {
                var value;
                if (method === "required") {
                    value = $element.get(0).getAttribute(method);
                    if (value === "") {
                        value = true;
                    }
                    value = !!value;
                } else {
                    value = $element.attr(method);
                }
                if (value) {
                    rules[method] = value;
                } else if ($element[0].getAttribute("type") === method) {
                    rules[method] = true;
                }
            }
            if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
                delete rules.maxlength;
            }
            return rules;
        },
        dataRules: function(element) {
            var method, value, rules = {}, $element = $(element);
            for (method in $.validator.methods) {
                value = $element.data("rule-" + method.toLowerCase());
                if (value !== undefined) {
                    rules[method] = value;
                }
            }
            return rules;
        },
        staticRules: function(element) {
            var rules = {};
            var validator = $.data(element.form, "validator");
            if (validator.settings.rules) {
                rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
            }
            return rules;
        },
        normalizeRules: function(rules, element) {
            $.each(rules, function(prop, val) {
                if (val === false) {
                    delete rules[prop];
                    return;
                }
                if (val.param || val.depends) {
                    var keepRule = true;
                    switch (typeof val.depends) {
                      case "string":
                        keepRule = !!$(val.depends, element.form).length;
                        break;

                      case "function":
                        keepRule = val.depends.call(element, element);
                        break;
                    }
                    if (keepRule) {
                        rules[prop] = val.param !== undefined ? val.param : true;
                    } else {
                        delete rules[prop];
                    }
                }
            });
            $.each(rules, function(rule, parameter) {
                rules[rule] = $.isFunction(parameter) ? parameter(element) : parameter;
            });
            $.each([ "minlength", "maxlength" ], function() {
                if (rules[this]) {
                    rules[this] = Number(rules[this]);
                }
            });
            $.each([ "rangelength" ], function() {
                var parts;
                if (rules[this]) {
                    if ($.isArray(rules[this])) {
                        rules[this] = [ Number(rules[this][0]), Number(rules[this][1]) ];
                    } else if (typeof rules[this] === "string") {
                        parts = rules[this].split(/[\s,]+/);
                        rules[this] = [ Number(parts[0]), Number(parts[1]) ];
                    }
                }
            });
            if ($.validator.autoCreateRanges) {
                if (rules.min && rules.max) {
                    rules.range = [ rules.min, rules.max ];
                    delete rules.min;
                    delete rules.max;
                }
                if (rules.minlength && rules.maxlength) {
                    rules.rangelength = [ rules.minlength, rules.maxlength ];
                    delete rules.minlength;
                    delete rules.maxlength;
                }
            }
            return rules;
        },
        normalizeRule: function(data) {
            if (typeof data === "string") {
                var transformed = {};
                $.each(data.split(/\s/), function() {
                    transformed[this] = true;
                });
                data = transformed;
            }
            return data;
        },
        addMethod: function(name, method, message) {
            $.validator.methods[name] = method;
            $.validator.messages[name] = message !== undefined ? message : $.validator.messages[name];
            if (method.length < 3) {
                $.validator.addClassRules(name, $.validator.normalizeRule(name));
            }
        },
        methods: {
            required: function(value, element, param) {
                if (!this.depend(param, element)) {
                    return "dependency-mismatch";
                }
                if (element.nodeName.toLowerCase() === "select") {
                    var val = $(element).val();
                    return val && val.length > 0;
                }
                if (this.checkable(element)) {
                    return this.getLength(value, element) > 0;
                }
                return $.trim(value).length > 0;
            },
            remote: function(value, element, param) {
                if (this.optional(element)) {
                    return "dependency-mismatch";
                }
                var previous = this.previousValue(element);
                if (!this.settings.messages[element.name]) {
                    this.settings.messages[element.name] = {};
                }
                previous.originalMessage = this.settings.messages[element.name].remote;
                this.settings.messages[element.name].remote = previous.message;
                param = typeof param === "string" && {
                    url: param
                } || param;
                if (previous.old === value) {
                    return previous.valid;
                }
                previous.old = value;
                var validator = this;
                this.startRequest(element);
                var data = {};
                data[element.name] = value;
                $.ajax($.extend(true, {
                    url: param,
                    mode: "abort",
                    port: "validate" + element.name,
                    dataType: "json",
                    data: data,
                    success: function(response) {
                        validator.settings.messages[element.name].remote = previous.originalMessage;
                        var valid = response === true || response === "true";
                        if (valid) {
                            var submitted = validator.formSubmitted;
                            validator.prepareElement(element);
                            validator.formSubmitted = submitted;
                            validator.successList.push(element);
                            delete validator.invalid[element.name];
                            validator.showErrors();
                        } else {
                            var errors = {};
                            var message = response || validator.defaultMessage(element, "remote");
                            errors[element.name] = previous.message = $.isFunction(message) ? message(value) : message;
                            validator.invalid[element.name] = true;
                            validator.showErrors(errors);
                        }
                        previous.valid = valid;
                        validator.stopRequest(element, valid);
                    }
                }, param));
                return "pending";
            },
            minlength: function(value, element, param) {
                var length = $.isArray(value) ? value.length : this.getLength($.trim(value), element);
                return this.optional(element) || length >= param;
            },
            maxlength: function(value, element, param) {
                var length = $.isArray(value) ? value.length : this.getLength($.trim(value), element);
                return this.optional(element) || length <= param;
            },
            rangelength: function(value, element, param) {
                var length = $.isArray(value) ? value.length : this.getLength($.trim(value), element);
                return this.optional(element) || length >= param[0] && length <= param[1];
            },
            min: function(value, element, param) {
                return this.optional(element) || value >= param;
            },
            max: function(value, element, param) {
                return this.optional(element) || value <= param;
            },
            range: function(value, element, param) {
                return this.optional(element) || value >= param[0] && value <= param[1];
            },
            email: function(value, element) {
                return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
            },
            url: function(value, element) {
                return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
            },
            date: function(value, element) {
                return this.optional(element) || !/Invalid|NaN/.test(new Date(value).toString());
            },
            dateISO: function(value, element) {
                return this.optional(element) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
            },
            number: function(value, element) {
                return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
            },
            digits: function(value, element) {
                return this.optional(element) || /^\d+$/.test(value);
            },
            creditcard: function(value, element) {
                if (this.optional(element)) {
                    return "dependency-mismatch";
                }
                if (/[^0-9 \-]+/.test(value)) {
                    return false;
                }
                var nCheck = 0, nDigit = 0, bEven = false;
                value = value.replace(/\D/g, "");
                for (var n = value.length - 1; n >= 0; n--) {
                    var cDigit = value.charAt(n);
                    nDigit = parseInt(cDigit, 10);
                    if (bEven) {
                        if ((nDigit *= 2) > 9) {
                            nDigit -= 9;
                        }
                    }
                    nCheck += nDigit;
                    bEven = !bEven;
                }
                return nCheck % 10 === 0;
            },
            equalTo: function(value, element, param) {
                var target = $(param);
                if (this.settings.onfocusout) {
                    target.unbind(".validate-equalTo").bind("blur.validate-equalTo", function() {
                        $(element).valid();
                    });
                }
                return value === target.val();
            }
        }
    });
    $.format = $.validator.format;
})(jQuery);

(function($) {
    var pendingRequests = {};
    if ($.ajaxPrefilter) {
        $.ajaxPrefilter(function(settings, _, xhr) {
            var port = settings.port;
            if (settings.mode === "abort") {
                if (pendingRequests[port]) {
                    pendingRequests[port].abort();
                }
                pendingRequests[port] = xhr;
            }
        });
    } else {
        var ajax = $.ajax;
        $.ajax = function(settings) {
            var mode = ("mode" in settings ? settings : $.ajaxSettings).mode, port = ("port" in settings ? settings : $.ajaxSettings).port;
            if (mode === "abort") {
                if (pendingRequests[port]) {
                    pendingRequests[port].abort();
                }
                return pendingRequests[port] = ajax.apply(this, arguments);
            }
            return ajax.apply(this, arguments);
        };
    }
})(jQuery);

(function($) {
    $.extend($.fn, {
        validateDelegate: function(delegate, type, handler) {
            return this.bind(type, function(event) {
                var target = $(event.target);
                if (target.is(delegate)) {
                    return handler.apply(target, arguments);
                }
            });
        }
    });
})(jQuery);

(function() {
    function stripHtml(value) {
        return value.replace(/<.[^<>]*?>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/[.(),;:!?%#$'"_+=\/\-]*/g, "");
    }
    jQuery.validator.addMethod("maxWords", function(value, element, params) {
        return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length <= params;
    }, jQuery.validator.format("Please enter {0} words or less."));
    jQuery.validator.addMethod("minWords", function(value, element, params) {
        return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length >= params;
    }, jQuery.validator.format("Please enter at least {0} words."));
    jQuery.validator.addMethod("rangeWords", function(value, element, params) {
        var valueStripped = stripHtml(value);
        var regex = /\b\w+\b/g;
        return this.optional(element) || valueStripped.match(regex).length >= params[0] && valueStripped.match(regex).length <= params[1];
    }, jQuery.validator.format("Please enter between {0} and {1} words."));
})();

jQuery.validator.addMethod("letterswithbasicpunc", function(value, element) {
    return this.optional(element) || /^[a-z\-.,()'"\s]+$/i.test(value);
}, "Letters or punctuation only please");

jQuery.validator.addMethod("alphanumeric", function(value, element) {
    return this.optional(element) || /^\w+$/i.test(value);
}, "Letters, numbers, and underscores only please");

jQuery.validator.addMethod("lettersonly", function(value, element) {
    return this.optional(element) || /^[a-z]+$/i.test(value);
}, "Letters only please");

jQuery.validator.addMethod("nowhitespace", function(value, element) {
    return this.optional(element) || /^\S+$/i.test(value);
}, "No white space please");

jQuery.validator.addMethod("ziprange", function(value, element) {
    return this.optional(element) || /^90[2-5]\d\{2\}-\d{4}$/.test(value);
}, "Your ZIP-code must be in the range 902xx-xxxx to 905-xx-xxxx");

jQuery.validator.addMethod("zipcodeUS", function(value, element) {
    return this.optional(element) || /\d{5}-\d{4}$|^\d{5}$/.test(value);
}, "The specified US ZIP Code is invalid");

jQuery.validator.addMethod("integer", function(value, element) {
    return this.optional(element) || /^-?\d+$/.test(value);
}, "A positive or negative non-decimal number please");

jQuery.validator.addMethod("vinUS", function(v) {
    if (v.length !== 17) {
        return false;
    }
    var i, n, d, f, cd, cdv;
    var LL = [ "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" ];
    var VL = [ 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 7, 9, 2, 3, 4, 5, 6, 7, 8, 9 ];
    var FL = [ 8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2 ];
    var rs = 0;
    for (i = 0; i < 17; i++) {
        f = FL[i];
        d = v.slice(i, i + 1);
        if (i === 8) {
            cdv = d;
        }
        if (!isNaN(d)) {
            d *= f;
        } else {
            for (n = 0; n < LL.length; n++) {
                if (d.toUpperCase() === LL[n]) {
                    d = VL[n];
                    d *= f;
                    if (isNaN(cdv) && n === 8) {
                        cdv = LL[n];
                    }
                    break;
                }
            }
        }
        rs += d;
    }
    cd = rs % 11;
    if (cd === 10) {
        cd = "X";
    }
    if (cd === cdv) {
        return true;
    }
    return false;
}, "The specified vehicle identification number (VIN) is invalid.");

jQuery.validator.addMethod("dateITA", function(value, element) {
    var check = false;
    var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (re.test(value)) {
        var adata = value.split("/");
        var gg = parseInt(adata[0], 10);
        var mm = parseInt(adata[1], 10);
        var aaaa = parseInt(adata[2], 10);
        var xdata = new Date(aaaa, mm - 1, gg);
        if (xdata.getFullYear() === aaaa && xdata.getMonth() === mm - 1 && xdata.getDate() === gg) {
            check = true;
        } else {
            check = false;
        }
    } else {
        check = false;
    }
    return this.optional(element) || check;
}, "Please enter a correct date");

jQuery.validator.addMethod("dateNL", function(value, element) {
    return this.optional(element) || /^(0?[1-9]|[12]\d|3[01])[\.\/\-](0?[1-9]|1[012])[\.\/\-]([12]\d)?(\d\d)$/.test(value);
}, "Vul hier een geldige datum in.");

jQuery.validator.addMethod("time", function(value, element) {
    return this.optional(element) || /^([01]\d|2[0-3])(:[0-5]\d){1,2}$/.test(value);
}, "Please enter a valid time, between 00:00 and 23:59");

jQuery.validator.addMethod("time12h", function(value, element) {
    return this.optional(element) || /^((0?[1-9]|1[012])(:[0-5]\d){1,2}( ?[AP]M))$/i.test(value);
}, "Please enter a valid time in 12-hour format");

jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || phone_number.length > 9 && phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

jQuery.validator.addMethod("phoneUK", function(phone_number, element) {
    phone_number = phone_number.replace(/\(|\)|\s+|-/g, "");
    return this.optional(element) || phone_number.length > 9 && phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?)|(?:\(?0))(?:(?:\d{5}\)?\s?\d{4,5})|(?:\d{4}\)?\s?(?:\d{5}|\d{3}\s?\d{3}))|(?:\d{3}\)?\s?\d{3}\s?\d{3,4})|(?:\d{2}\)?\s?\d{4}\s?\d{4}))$/);
}, "Please specify a valid phone number");

jQuery.validator.addMethod("mobileUK", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+|-/g, "");
    return this.optional(element) || phone_number.length > 9 && phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?|0)7(?:[45789]\d{2}|624)\s?\d{3}\s?\d{3})$/);
}, "Please specify a valid mobile number");

jQuery.validator.addMethod("phonesUK", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+|-/g, "");
    return this.optional(element) || phone_number.length > 9 && phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?|0)(?:1\d{8,9}|[23]\d{9}|7(?:[45789]\d{8}|624\d{6})))$/);
}, "Please specify a valid uk phone number");

jQuery.validator.addMethod("postcodeUK", function(postcode, element) {
    postcode = postcode.toUpperCase().replace(/\s+/g, "");
    return this.optional(element) || postcode.match(/^([^QZ][^IJZ]{0,1}\d{1,2})(\d[^CIKMOV]{2})$/) || postcode.match(/^([^QV]\d[ABCDEFGHJKSTUW])(\d[^CIKMOV]{2})$/) || postcode.match(/^([^QV][^IJZ]\d[ABEHMNPRVWXY])(\d[^CIKMOV]{2})$/) || postcode.match(/^(GIR)(0AA)$/) || postcode.match(/^(BFPO)(\d{1,4})$/) || postcode.match(/^(BFPO)(C\/O\d{1,3})$/);
}, "Please specify a valid postcode");

jQuery.validator.addMethod("strippedminlength", function(value, element, param) {
    return jQuery(value).text().length >= param;
}, jQuery.validator.format("Please enter at least {0} characters"));

jQuery.validator.addMethod("email2", function(value, element, param) {
    return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
}, jQuery.validator.messages.email);

jQuery.validator.addMethod("url2", function(value, element, param) {
    return this.optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}, jQuery.validator.messages.url);

jQuery.validator.addMethod("creditcardtypes", function(value, element, param) {
    if (/[^0-9\-]+/.test(value)) {
        return false;
    }
    value = value.replace(/\D/g, "");
    var validTypes = 0;
    if (param.mastercard) {
        validTypes |= 1;
    }
    if (param.visa) {
        validTypes |= 2;
    }
    if (param.amex) {
        validTypes |= 4;
    }
    if (param.dinersclub) {
        validTypes |= 8;
    }
    if (param.enroute) {
        validTypes |= 16;
    }
    if (param.discover) {
        validTypes |= 32;
    }
    if (param.jcb) {
        validTypes |= 64;
    }
    if (param.unknown) {
        validTypes |= 128;
    }
    if (param.all) {
        validTypes = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128;
    }
    if (validTypes & 1 && /^(5[12345])/.test(value)) {
        return value.length === 16;
    }
    if (validTypes & 2 && /^(4)/.test(value)) {
        return value.length === 16;
    }
    if (validTypes & 4 && /^(3[47])/.test(value)) {
        return value.length === 15;
    }
    if (validTypes & 8 && /^(3(0[012345]|[68]))/.test(value)) {
        return value.length === 14;
    }
    if (validTypes & 16 && /^(2(014|149))/.test(value)) {
        return value.length === 15;
    }
    if (validTypes & 32 && /^(6011)/.test(value)) {
        return value.length === 16;
    }
    if (validTypes & 64 && /^(3)/.test(value)) {
        return value.length === 16;
    }
    if (validTypes & 64 && /^(2131|1800)/.test(value)) {
        return value.length === 15;
    }
    if (validTypes & 128) {
        return true;
    }
    return false;
}, "Please enter a valid credit card number.");

jQuery.validator.addMethod("ipv4", function(value, element, param) {
    return this.optional(element) || /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(value);
}, "Please enter a valid IP v4 address.");

jQuery.validator.addMethod("ipv6", function(value, element, param) {
    return this.optional(element) || /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(value);
}, "Please enter a valid IP v6 address.");

jQuery.validator.addMethod("pattern", function(value, element, param) {
    if (this.optional(element)) {
        return true;
    }
    if (typeof param === "string") {
        param = new RegExp("^(?:" + param + ")$");
    }
    return param.test(value);
}, "Invalid format.");

jQuery.validator.addMethod("require_from_group", function(value, element, options) {
    var validator = this;
    var selector = options[1];
    var validOrNot = $(selector, element.form).filter(function() {
        return validator.elementValue(this);
    }).length >= options[0];
    if (!$(element).data("being_validated")) {
        var fields = $(selector, element.form);
        fields.data("being_validated", true);
        fields.valid();
        fields.data("being_validated", false);
    }
    return validOrNot;
}, jQuery.format("Please fill at least {0} of these fields."));

jQuery.validator.addMethod("skip_or_fill_minimum", function(value, element, options) {
    var validator = this;
    var numberRequired = options[0];
    var selector = options[1];
    var numberFilled = $(selector, element.form).filter(function() {
        return validator.elementValue(this);
    }).length;
    var valid = numberFilled >= numberRequired || numberFilled === 0;
    if (!$(element).data("being_validated")) {
        var fields = $(selector, element.form);
        fields.data("being_validated", true);
        fields.valid();
        fields.data("being_validated", false);
    }
    return valid;
}, jQuery.format("Please either skip these fields or fill at least {0} of them."));

jQuery.validator.addMethod("accept", function(value, element, param) {
    var typeParam = typeof param === "string" ? param.replace(/\s/g, "").replace(/,/g, "|") : "image/*", optionalValue = this.optional(element), i, file;
    if (optionalValue) {
        return optionalValue;
    }
    if ($(element).attr("type") === "file") {
        typeParam = typeParam.replace(/\*/g, ".*");
        if (element.files && element.files.length) {
            for (i = 0; i < element.files.length; i++) {
                file = element.files[i];
                if (!file.type.match(new RegExp(".?(" + typeParam + ")$", "i"))) {
                    return false;
                }
            }
        }
    }
    return true;
}, jQuery.format("Please enter a value with a valid mimetype."));

jQuery.validator.addMethod("extension", function(value, element, param) {
    param = typeof param === "string" ? param.replace(/,/g, "|") : "png|jpe?g|gif";
    return this.optional(element) || value.match(new RegExp(".(" + param + ")$", "i"));
}, jQuery.format("Please enter a value with a valid extension."));

function isDefined(objectToValidate, defaultValue) {
    if (typeof objectToValidate === "undefined") {
        if (typeof defaultValue === "undefined") {
            return false;
        } else {
            return defaultValue;
        }
    } else {
        if (typeof defaultValue === "undefined") {
            return true;
        } else {
            return objectToValidate;
        }
    }
}

jQuery.extend(jQuery.validator.messages, {
    required: "Campo obrigatório",
    equalTo: "O campo inserido terá de ser igual. Por favor, insira novamente.",
    remote: "Please fix this field.",
    email: "Por favor, insira um e-mail válido.",
    url: "Por favor, insira um url válido. Por exemplo: http://www.axa.pt",
    date: "Por favor, insira uma data válida.",
    dateISO: "Please enter a valid date (ISO).",
    number: "Please enter a valid number.",
    digits: "Por favor, insira apenas números.",
    creditcard: "Please enter a valid credit card number.",
    accept: "Please enter a value with a valid extension.",
    maxlength: jQuery.validator.format("Por favor, insira no máximo {0} caracteres."),
    minlength: jQuery.validator.format("Por favor, insira pelo menos {0} caracteres."),
    rangelength: jQuery.validator.format("Please enter a value between {0} and {1} characters long."),
    range: jQuery.validator.format("Please enter a value between {0} and {1}."),
    max: jQuery.validator.format("Por favor no máximo {0} elementos."),
    min: jQuery.validator.format("Por favor insira pelo menos {0} elemento."),
    postalcode_pt: "Por favor, insira o código postal no formato correto. Ex.: 1600-077"
});

function FormBuilder(pars) {
    var _this = this;
    this.params = isDefined(pars, {});
    this.formValidator = null;
    this.id = new Date().getTime();
    this.uploader = this.params.form_uploader;
    if (!isDefined(this.params.form_selector)) {
        return false;
    }
    this.form = $(this.params.form_selector);
    if (this.form.length == 0) {
        return false;
    }
    if (!isDefined(this.params.submit_selector)) {
        return false;
    }
    this.submitButton = $(this.params.submit_selector, this.form);
    if (this.submitButton.length == 0) {
        return false;
    }
    this.submitButton.data("form", this.form);
    if (!(this.submitButton.attr("type") == "submit")) {
        this.submitButton.bind("click", function(e) {
            e.preventDefault();
            if (_this.form.valid()) _this.form.submit();
        });
    }
    if (isDefined(this.params.validation)) {
        this.createValidation(this.params.validation);
        if (isDefined(this.params.validation.conditional_required)) {
            this.createConditionalRequired(this.params.validation.conditional_required);
        }
    }
    jQuery.validator.addMethod("selectcheck", function(value) {
        return value != "0";
    }, "year required");
    jQuery.validator.addMethod("postalcode_pt", function(value) {
        var pattern = /[0-9]{4}\-[0-9]{3}/;
        return pattern.test(value) && value.length == 8 || value == "";
    });
    jQuery.validator.addMethod("breeders_code", function(value) {
        return value.length == 4 || value.length == 0;
    });
    jQuery.validator.addMethod("where_to_buy", function(value) {
        return value != "";
    });
    jQuery.validator.addMethod("select_required", function(val) {
        var value = val == null ? "" : val;
        return value != "";
    });
    jQuery.validator.addMethod("added_pets", function(value) {
        if (value != "") {
            var jData = $.parseJSON(decodeURIComponent(value));
            if (jData != null && jData.length > 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    });
}

FormBuilder.prototype.createValidation = function(validationParams) {
    var _this = this;
    var rules = [];
    if (isDefined(validationParams.messages)) this.addValidationMessages(validationParams.messages);
    if (isDefined(validationParams.rules)) rules = validationParams.rules;
    this.formValidator = this.form.validate({
        ignore: isDefined(validationParams.ignore),
        rules: rules,
        errorPlacement: function(error, element) {
            _this.errorPlacement(error, element);
        },
        success: function(error, element) {
            _this.validationSuccess(error, element);
        }
    });
};

FormBuilder.prototype.addValidationMessages = function(messagesObject) {
    jQuery.extend(jQuery.validator.messages, messagesObject);
};

FormBuilder.prototype.errorPlacement = function(error, ele) {
    var element = $(ele);
    var parentData = $(ele).data("parentLineSelector");
    var err = null;
    if (isDefined(parentData, false)) {
        err = $(parentData).find(isDefined(this.params.error_selector, ".frm-error"));
    } else {
        err = element.closest(isDefined(this.params.parent_line_selector, ".form-group")).find(isDefined(this.params.error_selector, ".frm-error"));
    }
    err.html(error);
    err.show();
};

FormBuilder.prototype.validationSuccess = function(error, ele) {
    var element = $(ele);
    var parentData = $(ele).data("parentLineSelector");
    var err = null;
    if (isDefined(parentData, false)) {
        err = $(parentData).find(isDefined(this.params.error_selector, ".frm-error"));
    } else {
        err = element.closest(isDefined(this.params.parent_line_selector, ".form-group")).find(isDefined(this.params.error_selector, ".frm-error"));
    }
    err.hide();
};

FormBuilder.prototype.submitForm = function() {
    this.formValidator.form();
};

FormBuilder.prototype.createConditionalRequired = function(conditions) {
    for (var i = 0; i < conditions.length; i++) {
        var obj = conditions[i];
        this.bindConditionals(obj);
    }
};

FormBuilder.prototype.bindConditionals = function(obj) {
    var idVal = new Date().getTime();
    var req = $(obj.required_selector);
    var cond = $(obj.condition_selector);
    var rulesObj = isDefined(obj.rules, {});
    var startCheck = isDefined(obj.starts_with, null);
    var blockToShow = typeof obj.parent_block !== "undefined" ? req.parents(obj.parent_block) : [];
    var val = isDefined(obj.value_to_check, null);
    cond.bind("change.FormBuilder" + idVal + " ifChanged.FormBuilder" + idVal + " keyup.FormBuilder" + idVal + "", eventHandler);
    function eventHandler() {
        var startsWith = false;
        if (startCheck != null) startsWith = cond.val().indexOf(startCheck.toLowerCase()) == 0 || cond.val().indexOf(startCheck) == 0;
        var rules = {
            required: true
        };
        for (var prop in rulesObj) {
            rules[prop] = rulesObj[prop];
        }
        if (cond.is(":checked") || cond.val() == val && val != null || startsWith) {
            req.rules("add", rules);
            if (blockToShow.length > 0) blockToShow.show();
        } else {
            for (var removeProp in rules) {
                req.rules("remove", removeProp);
            }
            if (blockToShow.length > 0) blockToShow.hide();
        }
    }
    eventHandler();
};