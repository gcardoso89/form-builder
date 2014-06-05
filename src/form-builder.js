function FormBuilder(pars) {

    var _this = this;

    this.params = isDefined(pars, {});
    this.formValidator = null;
    this.id = new Date().getTime();

    this.uploader = this.params.form_uploader;

    if (!isDefined(this.params.form_selector)) {

        //console.log("Need to include a form selector parameter - form_selector");

        return false;

    }

    this.form = $(this.params.form_selector);

    if (this.form.length == 0) {

        //console.log("The form selector is returning 0 elements")

        return false;

    }

    if (!isDefined(this.params.submit_selector)) {

        //console.log("Need to include a submit button selector parameter - submit_selector")

        return false;

    }

    this.submitButton = $(this.params.submit_selector, this.form);

    if (this.submitButton.length == 0) {

        //console.log("The submit button selector is returning 0 elements")

        return false;

    }


    this.submitButton.data('form', this.form);

    if (!(this.submitButton.attr('type') == "submit")) {

        this.submitButton.bind('click', function (e) {
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

    jQuery.validator.addMethod('selectcheck', function (value) {
        return (value != '0');
    }, "year required");

    jQuery.validator.addMethod('postalcode_pt', function (value) {
        var pattern = /[0-9]{4}\-[0-9]{3}/;
        return ( (pattern.test(value) && value.length == 8) || value == "");
    });

    jQuery.validator.addMethod('breeders_code', function (value) {
        return ( value.length == 4 || value.length == 0 );
    });

    jQuery.validator.addMethod('where_to_buy', function (value) {
        return (value != "");
    });

    jQuery.validator.addMethod('select_required', function (value) {
        return (value != "");
    });

    jQuery.validator.addMethod('added_pets', function (value) {
        if (value != "" ){
            var jData = $.parseJSON(decodeURIComponent(value));
            if ( jData != null && jData.length > 0 ){
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }

    });

};

/**
 *
 * @param validationParams
 */
FormBuilder.prototype.createValidation = function (validationParams) {

    var _this = this;
    var rules = [];

    if (isDefined(validationParams.messages)) this.addValidationMessages(validationParams.messages);

    if (isDefined(validationParams.rules)) rules = validationParams.rules;

    this.formValidator = this.form.validate({

        ignore: isDefined(validationParams.ignore),

        rules: rules,

        errorPlacement: function (error, element) {

            _this.errorPlacement(error, element);

        },

        success: function (error, element) {

            _this.validationSuccess(error, element);

        }

    });


};

FormBuilder.prototype.addValidationMessages = function (messagesObject) {

    jQuery.extend(jQuery.validator.messages, messagesObject);

};

FormBuilder.prototype.errorPlacement = function (error, ele) {

    var element = $(ele);
    var parentData = $(ele).data('parentLineSelector');
    var err = null;

    if ( isDefined(parentData, false) ){
        err = $(parentData).find('.frm-error');
    }
    else {
        err = element.closest(isDefined( this.params.parent_line_selector , '.form-group' )).find('.frm-error');
    }

    err.html(error);
    err.show();

};

FormBuilder.prototype.validationSuccess = function (error, element) {

    /*var err = $(element).closest( isDefined(this.params.parent_line_selector, '.form-group') ).find('.frm-error');
     err.hide();*/

};

FormBuilder.prototype.submitForm = function () {

    this.formValidator.form();

};

FormBuilder.prototype.createConditionalRequired = function (conditions) {


    for (var i = 0; i < conditions.length; i++) {
        var obj = conditions[i];
        this.bindConditionals(obj);
    }

};

FormBuilder.prototype.bindConditionals = function (obj) {

    var idVal = new Date().getTime();
    var req = $(obj.required_selector);
    var cond = $(obj.condition_selector);
    var rulesObj = isDefined(obj.rules, {});
    var startCheck = isDefined(obj.starts_with, null);
    var blockToShow = ( typeof(obj.parent_block) !== "undefined" ) ? req.parents(obj.parent_block) : [];
    var val = isDefined(obj.value_to_check, null);

    cond.bind('change.FormBuilder' + idVal + ' ifChanged.FormBuilder' + idVal + ' keyup.FormBuilder' + idVal + '', eventHandler);

    function eventHandler() {

        var startsWith = false;

        if (startCheck != null) startsWith = ( cond.val().indexOf(startCheck.toLowerCase()) == 0 || cond.val().indexOf(startCheck) == 0 );

        var rules = {
            required: true
        };

        for (var prop in rulesObj) {
            rules[prop] = rulesObj[prop];
        }

        if (cond.is(':checked') || ( cond.val() == val && val != null ) || startsWith) {

            req.rules("add", rules);

            if (blockToShow.length > 0) blockToShow.show();

        }
        else {

            for (var removeProp in rules) {
                req.rules("remove", removeProp);
            };

            if (blockToShow.length > 0) blockToShow.hide();

        }

    }

    eventHandler();

}