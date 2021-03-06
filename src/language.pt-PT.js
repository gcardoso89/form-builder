jQuery.extend(jQuery.validator.messages, {
    required: 'Campo obrigatório',
    equalTo: 'O campo inserido terá de ser igual. Por favor, insira novamente.',
    remote: "Please fix this field.",
    email: "Por favor, insira um e-mail válido.",
    url: 'Por favor, insira um url válido. Por exemplo: http://www.axa.pt',
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