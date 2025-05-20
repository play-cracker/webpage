window.addEventListener('load', function (){
  if(typeof(google) === 'object'){
    _google_auto_login('one-tab-container', 'sso-btn', 'sso-btn-group'); 
  }
});

$(document).on('dblclick', function () {
  $('.menu_panel').css('display', 'none');
});

let refInterval1 = null;
let refInterval2 = null;
let refInterval3 = null;

$(document).ready(function () {
  _sso_active_event();
  _stickyFooter();
  __stickyStrip();
  _input_animation();
  _password_animation();
  _handle_sso_btn_event();
 
  if($('.input-group.date').length){
    $('.input-group.date').datepicker({format: "dd-mm-yyyy"}); 
  }

  if($('.input_animation').length){
    $('input').on('input change', function(){
      _input_animation();
      _err_msg_remove(this);  
    });
  }

  $('#referral').on('change', function(){
    _referral_event();
  });

  $("#resend-activated_otp").on('click', function(e){
    e.preventDefault(); 
    set_timer();
    _call_form_ajax($('#resendOtpForm'));
  });

  $('.resend-activated_otp').on('click', function(e){
    e.preventDefault(); 

    let form_id = $(this).attr('data-trigger');
    let timer_id = $(this).attr('data-timer-id');
    let timer_block_id = $(this).attr('data-timer-block-id');
    let resend_block_id = $(this).attr('data-resend-block-id');

    refInterval3 = dynamic_set_timer(timer_id, timer_block_id, resend_block_id);
    _call_form_ajax($(form_id)); 
  });

  $('.validate ').on('submit', function(e){
    $('.loginBtn').prop('disabled', true);
    if($(this).attr('acton-module') == 'sticky'){
      e.preventDefault(); 
      _call_form_ajax(this);
    }
  });

  $('.custom-toggle').on('click', function(){
    custom_toggle(this);
  });
  
  $('.nav_icon').on('click', function () {
    $('.menu_panel').toggle();
  });

  $(".back_profile").on('click', function () {
    $('.menu_panel').toggle();
    $('#msg-alert').empty();
    $('.edit_step2').addClass('hidden');
    $('.edit_step1').removeClass('hidden');
    $('#confirm-delete-account')[0].reset();
    $('#delete_profile').find('.input_animation').removeClass('required_feild');
  });

  $(window).on("resize", function(){
    _stickyFooter();
  });

});


function _password_animation(){
  const psw_ind = '.input_animation > .psw_visibility';
  $(psw_ind).on('click', function(){
    let psw_fd = '.input_animation > .psw_input';
    let showpass = '.showpass';
    let hidepass = '.hidepass';
    if($(this).data('trigger') !== undefined){
      psw_fd = $(this).data('trigger');
    }
    if($(this).data('show_trigger') !== undefined){
      showpass = $(this).data('show_trigger');
    }
    if($(this).data('hide_trigger') !== undefined){
      hidepass = $(this).data('hide_trigger');
    }

    $(this).addClass('hidden');
    if($(psw_fd ).attr('type') == 'password'){
      $(showpass).removeClass('hidden');
      $(psw_fd).attr('type', 'text');
    } else {
      $(hidepass).removeClass('hidden');
      $(psw_fd).attr('type', 'password');
    }
  });
}


function _err_msg_remove(e){
  let parent = $(e).parent();
  let fn_em = $(parent).children('.error-message');
  let fn_er = $(parent).children('.error');
  if(!$(e).hasClass("exclude-err-remove")){
    if(fn_em.length){
      fn_em.remove();
    }
    if(fn_er.length){
        fn_er.remove();
    }
  } else {
    fn_em.empty();
    fn_er.empty();
  }
  if($(parent).hasClass('required_feild')){
    $(parent).removeClass('required_feild');
  }

}


function _input_animation(){
  let input_animation = $('.input_animation').find('input');
      
  input_animation.each(function() {
    var label = $(this).next('label'),
        input_val = $(this).val();
    if ( input_val != "" ) {
    label.addClass('focus_effct');
    } else {
    label.removeClass('focus_effct');
    }
  });
}

function _referral_event(){
  const selector = '#referral';
  const input = '#referral_input';
  const label = '#referral_label';
  const referral_input_block = '#referral_input_block';

  $(input + ', ' + label + ', ' + referral_input_block).css('display', 'none');
  if($(selector).is(':checked')){
    $(input + ', ' + label + ', ' + referral_input_block).css('display', 'block');
  } else {
    $(input).val('');
  }

  $('.ref_block').find('.input_animation').removeClass('required_feild');
  $('.ref_block').find('.error-message').remove();
}

function _reset_captcha(data){
  var c_type = $('input[name="captcha_type"').val();
  if(c_type === undefined){
     return true;
  }
  switch(c_type){
      case 'recaptcha' : grecaptcha.reset();
      break;
      case 'html_captcha' :
          $('.captcha_html').html(data.captcha_html);
      break;
  }
}

function _set_error_inline(collection){
  $.each(collection, function (index, value) { 
    let err_key = '.' + index + '-err';
      $(err_key).html(value);
      if($(err_key).parent().hasClass('input_animation')){
        $(err_key).parent().addClass('required_feild');
      }
  });
}


function _forgot_password_success(data){
  if(data.otp_send_flag){
      $('#g-recaptcha-1').remove();
      $('#span_message').html(data.span_message);
      $('#login-uesrname').val(data.username);
      $('#otp-login').val(data.username);
      $('#forgot-password').addClass('hidden');
      $('#otp-verify').removeClass('hidden');
      set_timer();
  }

  if(data.form_error){
    _set_error_inline(data.form_error)
  }
}


function _otp_verified(data){
  if(data.form_error){
    _set_error_inline(data.form_error);
  }
  if(data.message == "validated"){
    location.reload();
  }
}

function _resend_otp(data){
  _extended_common_alert(data, '#msg-alert');
  $('#resend-code').addClass('hidden'); 
  $('#clock-timer').removeClass('hidden');
}

function _google_auto_login(prompt_parent_id, sso_parent_id, sso_parent_class){
  if(!document.getElementById(prompt_parent_id)){
    return false;
  }
  const author = document.getElementById(prompt_parent_id).getAttribute('data-author');
  const nonce = document.getElementById(prompt_parent_id).getAttribute('data-nonce');
  google.accounts.id.initialize({
      client_id: author,
      callback: handleCredentialResponse,
      prompt_parent_id: prompt_parent_id,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: false,
      context: "use",
      nonce: nonce,
  });
  google.accounts.id.prompt((notification) => {
    let prompt_parent_element = document.getElementById(prompt_parent_id);
    let sso_parent_element = document.getElementById(sso_parent_id);

    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      prompt_parent_element.classList.add("hidden");
      if(sso_parent_element){
        sso_parent_element.classList.remove(sso_parent_class);
      }
    }
    if (notification.isDisplayed()) {
      if(sso_parent_element){
        sso_parent_element.classList.add(sso_parent_class);
      }
      prompt_parent_element.classList.remove("hidden");
    }
  });
}

function handleCredentialResponse(response) {
  let responsePayload = parseJwt(response.credential);
  if(responsePayload.email_verified){
    responsePayload.res_type = (window._sso__data._active_path_regex_result) ? 'redirect' : 'onfly';
    responsePayload.theme_version = document.querySelector('[name="theme_version"]').value ?? '';
    responsePayload.token = document.querySelector('[name="token"]').value;
    _call_ajax('POST', site_url + 'user/google_one_tap_login', responsePayload, '_onFly_login');
  }
}


function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

function custom_toggle(e){
  const name = $(e).attr('data-name');
  const value = $(e).attr('data-value');
  const target = $(e).attr('data-target');
  const reset = $(e).attr('data-reset');

  $(target).addClass('hidden');
  if($('input[name='+name+']:checked').val() == value){
    $(target).removeClass('hidden');
  } else {
    $(reset).val('');
  }
}

function update_email_success(data){
  _extended_common_alert(data, '#msg-alert');
  if(data.form_error){
    _set_error_inline(data.form_error);
    $('.error-message').show();
  }
  if(data.res_data.otp_status == 'otp_sent'){
    clearInterval(refInterval1);
    clearInterval(refInterval2);
    clearInterval(refInterval3);

    refInterval1 = dynamic_set_timer('#timer1', '#clock-timer1', '#resend-code1');
    refInterval2 = dynamic_set_timer('#timer2', '#clock-timer2', '#resend-code2');
    $('input[name=new_login]').val($('.new_input').val());
    $('#display-new-login').html(data.res_data.display_constant);
    $('#inline_msg').html(data.res_data.inline_msg);
    $('.edit_step1').addClass('hidden');
    $('.edit_step2').removeClass('hidden');
  }
}

function dynamic_set_timer(timer_id, timer_block_id, resend_block_id, counter=60){
  $(timer_block_id).removeClass('hidden');
  $(resend_block_id).addClass('hidden');
  $(timer_id).html(counter);
    var interval = setInterval(function () {
        counter--;
        // Display 'counter' wherever you want to display it.
        if (counter <= 0) {
            clearInterval(interval);
            $(timer_block_id).addClass('hidden');
            $(resend_block_id).removeClass('hidden');
            return;
        } else {
            $(timer_id).html(counter);
        }
    }, 1000);

    return interval;
}

function _stickyFooter(){
  let bodyHeight   = $("body").height();
  let windowHeight   = $(window).height();
  if(bodyHeight < windowHeight) {	
    let headerHeight = $("header").outerHeight() ?? $(".header").outerHeight();
    let footerHeight = $(".footer-new").outerHeight() ?? $(".new_footer").outerHeight() ?? $(".diy_footer").outerHeight();  //.footer need to implement also.
    let padding = $(".fit-height").outerHeight() - $(".fit-height").height();
    let fitHeight = windowHeight - (headerHeight + footerHeight + padding);
    
    if(fitHeight){
      $(".fit-height").addClass("fit");
      $('.fit').height(fitHeight);
    }
  } else {								
    $(".fit-height").removeClass("fit");
    $('.fit-height').css('height', '');
  }
}

function __stickyStrip(){
  if($('.sticky_strip').length){
    const stickyStrip_class = "is-sticky";
    const strip_el = $(".sticky_strip")
    window.addEventListener("scroll", () => {
      let currentScroll = window.pageYOffset;
      let footerHeight = $(".footer-new").offset() ?? $(".new_footer").offset() ?? $(".diy_footer").offset(); 
      let sticky_strip = strip_el.outerHeight();
      if((currentScroll+screen.height < footerHeight.top + sticky_strip) && currentScroll > 10){ 
        strip_el.addClass(stickyStrip_class);
      } else {
        strip_el.removeClass(stickyStrip_class);
      }
    });
  }
}

function _handle_sso_btn_event(){
  if($(".sso-btn, #sso-btn").length){
    const active_location = window.location;
    const sso_arr = ['google', 'facebook'];
    const sso_el_selector = "sso-btn a[href*='user/oauth2']";
    const sso_regex = /user\/oauth2\/(google|facebook)/;
    const sso_regex_result = window._sso__data._active_path_regex_result;
    let sso_el =  ($('#' + sso_el_selector).length) ? $('#' + sso_el_selector) : $('.' + sso_el_selector);
    $.each(sso_el, function (indexInArray, valueOfElement) { 
      if(sso_regex.test($(valueOfElement).attr('href'))){
          let do_sso_url = '';
          let sso_url = $(valueOfElement).attr('href');
          let sso_slash_flag = (sso_url[sso_url.length - 1] == '/');
          let segment_slash_flag = (active_location.pathname[0] == '/');
          if(sso_slash_flag && segment_slash_flag && !sso_regex_result){
              do_sso_url = sso_url.substring(0, (sso_url.length - 1));
          } else if(!sso_slash_flag && (!segment_slash_flag || sso_regex_result)){
              do_sso_url = sso_url   + '/';
          } else {
              do_sso_url = sso_url;
          } 
          do_sso_url += (sso_regex_result) ? 'dashboard' : active_location.pathname + active_location.search + active_location.hash;
          $(valueOfElement).attr('href', do_sso_url);
      }
    });


    $(sso_el).on('click', function(e){
        if(window._sso__data._active_path_regex_result._partner_event_el.length){
            e.preventDefault();
    
            var active_sso = $(this).attr('href').split('/').filter(function(arr_el){
                return (sso_arr.indexOf(arr_el) !== -1);
            });
            var redirect_url = site_url + 'user/oauth2/' + active_sso[0] + '/';
            switch(window._sso__data._active_path_regex_result._partner_event_type){
                case 'redirect' : 
                    redirect_url += window._sso__data._active_path_regex_result._partner_event_value.replace(site_url, '');
                break;
                case 'trigger_click' : 
                    onclick_url = $(window._sso__data._active_path_regex_result._partner_event_value).attr('onclick');
                    if(onclick_url){
                        redirect_url += onclick_url.split(site_url)[1].replace(/[^-_#\w]+/g, '');
                    } else {
                        redirect_url = $(this).attr('href');
                    }

                break;
            }
            
            window.location = redirect_url;
        }
    });
  }
}

function _sso_active_event(){
  const sso_path_regex = /(login|register|resetpassword|forgotpassword|user\/sendactivation)/g;
  const sso_active_path_regex_result = sso_path_regex.test(window.location.pathname);
  const sso_partner_event_el = $('#sso_event_type');
  const sso_partner_event_type = sso_partner_event_el.data('event-type');
  const sso_partner_event_value = sso_partner_event_el.data('event-type');
  window._sso__data = {
    _active_path_regex_pattern : sso_path_regex,
    _active_path_regex_result : sso_active_path_regex_result,
    _partner_event_el : sso_partner_event_el,
    _partner_event_type : sso_partner_event_type,
    _partner_event_value : sso_partner_event_value
  };
}
