## FormBuilder plugin v0.3

# HOW TO USE

```javascript

<script src="[path_to_folder]/form-builder.0.3.min.js">
<script>

    $(function(){

        new FormBuilder({

            form_selector : 'form',

            submit_selector : 'input[type="submit"]',

            parent_line_selector : '.frm-line', //optional - default value ".form-group"

            error_selector : '.frm-error', //optional - default value ".frm-error"

            validation : {

                rules : {

                    name : {

                        required : true

                    }

                    postal : {

                        postalcode_pt : true

                    }

                },

                messages : {

                    postalcode_pt : "O seu código postal deverá ser xxxx-xxx"

                }

            }

        });

    });

</script>

```
# Version 0.3
- Run errorPlacement everytime, even after the error is placed;
- "change" and "ifChanged" events added.

# Version 0.2
- Added the error_selector parameter;

# Version 0.1
- First version
- Language pt-PT
- Includes validation for:
 1. Portugal Postal Code (xxxx-xxx);
 2. Select element value != "";


## Generate New Version Code
Using NodeJS and UglifyJS node package

Debug Version
```linux
$ uglifyjs src/jquery.validate.js src/additional-methods.js src/is-defined.js src/language.pt-PT.js src/form-builder.0.3.js -o form-builder.0.3.js -b
```

Minified Version
```linux
$ uglifyjs src/jquery.validate.js src/additional-methods.js src/is-defined.js src/language.pt-PT.js src/form-builder.0.3.js -o form-builder.0.3.min.js
```