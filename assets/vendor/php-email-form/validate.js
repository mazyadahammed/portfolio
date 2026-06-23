/**
* PHP Email Form Validation - v3.11
* URL: https://bootstrapmade.com/php-email-form/
* Author: BootstrapMade.com
*/
(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach( function(e) {
    e.addEventListener('submit', function(event) {
      event.preventDefault();

      let thisForm = this;

      let action = thisForm.getAttribute('action');
      let recaptcha = thisForm.getAttribute('data-recaptcha-site-key');
      
      if( ! action ) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }
      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');

      let formData = new FormData( thisForm );

      if ( recaptcha ) {
        if(typeof grecaptcha !== "undefined" ) {
          grecaptcha.ready(function() {
            try {
              grecaptcha.execute(recaptcha, {action: 'php_email_form_submit'})
              .then(token => {
                formData.set('recaptcha-response', token);
                php_email_form_submit(thisForm, action, formData);
              })
            } catch(error) {
              displayError(thisForm, error);
            }
          });
        } else {
          displayError(thisForm, 'The reCaptcha javascript API url is not loaded!')
        }
      } else {
        php_email_form_submit(thisForm, action, formData);
      }
    });
  });

  function php_email_form_submit(thisForm, action, formData) {
    fetch(action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(async response => {
      const isJson = response.headers.get("content-type")?.includes("application/json");
      if (response.ok) {
        if (isJson) {
          return response.json();
        } else {
          return response.text();
        }
      } else {
        if (isJson) {
          const data = await response.json();
          if (data && data.errors) {
            throw new Error(data.errors.map(err => err.message).join(", "));
          } else if (data && data.error) {
            throw new Error(data.error);
          }
        }
        throw new Error(`${response.status} ${response.statusText}`); 
      }
    })
    .then(data => {
      thisForm.querySelector('.loading').classList.remove('d-block');
      
      // If it's a JSON response from Formspree, check for ok/success
      const isSuccessfulJson = typeof data === 'object' && data !== null && (data.ok === true || data.success);
      // If it's a plain text response, check for 'OK'
      const isSuccessfulText = typeof data === 'string' && data.trim() === 'OK';

      if (isSuccessfulJson || isSuccessfulText || data === undefined) {
        thisForm.querySelector('.sent-message').classList.add('d-block');
        thisForm.reset(); 
      } else {
        const errStr = typeof data === 'string' ? data : JSON.stringify(data);
        throw new Error(errStr ? errStr : 'Form submission failed.'); 
      }
    })
    .catch((error) => {
      displayError(thisForm, error.message || error);
    });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    thisForm.querySelector('.error-message').innerHTML = error;
    thisForm.querySelector('.error-message').classList.add('d-block');
  }

})();
