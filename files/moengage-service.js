var MoengageService = /** @class */ (function () {
    function MoengageService(params) {
        this.start_time         = parseInt(new Date().getTime() / 1000);
        params                  = params || {};
        this.resource           = params.data_uri || '/clevertap';
        var data                = params.data || {};
        this.ct_event           = params.ct_event || null;
        this.eventData          = data.events;
        this.user               = data.user;
        this.logged_in          = this.user && this.user.id ? true : false;
        this.user_login_status  = this.logged_in ? 'logged_in_user' : 'guest_user';
        this.page_slug          = data.page_slug;
        this.income_source_view = params.income_source_view;
        this.current_ay         = data.current_ay;
        this.itr_status         = this.user ? this.user.itr_status : 'not_filed';
        this.pay_tax            = 'no';
        this.moe_user_check_attempts = 0;
        
        this.registerCallbacks();
    };

    MoengageService.prototype.registerCallbacks = function () {
        var that  = this;
        this.pushIdentity();
        this.prepareBackActionData();

        $(document).on( "click", "[data-ctid]", function( event ) {
            if ( !event.hasOwnProperty('originalEvent') ) {
                return;
            }

            var ctid = $(this).data('ctid');
            if ( that.eventData[ctid] ) {
                var element               = that.eventData[ctid];
                that.pushEvent(element.event_name, that.buildEventData(element, $(this)));
            }
        });
        if ( this.page_slug == 'guide' ) {
            window.addEventListener('beforeunload', (function(event) {
                this.pushEvent('guide', {
                    screen_name: this.transform_guide_page_guide_name(),
                    user_action: 'next',
                    user_login_status: this.user_login_status,
                    time_spent: parseInt(new Date().getTime() / 1000) - this.start_time,
                    itr_status:this.itr_status
                });
            }).bind(this));
        }
        if ( this.page_slug = 'efile-income-tax-return/computation' ) {
            $(".file_my_return_btn").click((function(event){
                this.pushEvent('FIY Jounrey Completed', {
                    'itr_id' : this.user.itr_id,
                    'assessment_year' : this.current_ay,
                });
            }).bind(this));
        }

        $(".payOnline, .payOffline").click((function(){
            this.pay_tax = 'yes';
        }).bind(this));

        this.pushPendingCtEvents();
        // this.askForNotification();
    };

    MoengageService.prototype.buildEventData = function(element, targeted_element=null) {
        var data = {};
        data[element.fixed_attribute_key]   = element.fixed_attribute_value;
        if ( element.trigger_attribute_key  ) {
            data[element.trigger_attribute_key] = element.trigger_attribute_value;
        }
        
        if ( element.extra_attributes ) {
            var extra = JSON.parse(element.extra_attributes);
            for (var key in extra) {
                data[key] = extra[key];
            }
        }

        for (var key in data) {
            value  = data[key];
            if ( value.startsWith('$ctc') ) {
                var method = 'transform_' + value.slice(1);
                data[key] = window.clevertaptaxoptimiser[method]($(this));
                continue;
            }
            if ( value.startsWith('$') ) {
                var method = 'transform_' + value.slice(1);
                data[key] = this[method]($(this), targeted_element);
            }
        }

        data.user_login_status = this.user_login_status;
        data.time_spent        = parseInt(new Date().getTime() / 1000) - this.start_time;
        data.itr_status        = this.itr_status;
        return data;
    };

    MoengageService.prototype.prepareBackActionData = function() {
        if ( this.page_slug == 'ca-assisted' && this.logged_in   ){
            return;
        }

        var back_ctid = $("[data-ctid-back]").attr('data-ctid-back') || false; // only one ctid for back
        this.backActionEvents = {};
        for (var key in this.eventData) {
            var element = this.eventData[key];
            if ( element.action == 'back' && (!back_ctid || key==back_ctid )) {
                this.backActionEvents[element.slug] = element;
            }
        }
        if ( this.income_source_view == 'yes_no') {
            delete this.backActionEvents['screen-name-income-normal-e9gz4l33x3'];
        } else if ( this.income_source_view == 'normal') {
            delete this.backActionEvents['screen-name-income-from-salary-pension-back-8cd232027e'];
        }
        if ( Object.keys(this.backActionEvents).length > 0   ) {
            if (window.history && window.history.pushState) {
                window.history.pushState('forward', null, null);
                window.addEventListener("popstate", (function(event) {
                    for (var index in this.backActionEvents) {
                        var data = this.backActionEvents[index];
                        this.pushEvent(data.event_name, this.buildEventData(data));
                    }
                    history.back();
                }).bind(this));
            }
        }
    };

    MoengageService.prototype.transform_name = function(element) {
        return element.attr('title');
    };

    MoengageService.prototype.dispatchGetStartedInCaAssisted = function(element) {
        var ctid = element.data('ctid');
        if ( ctid && this.eventData[ctid] ) {
            var element               = this.eventData[ctid];
            this.pushEvent(element.event_name, this.buildEventData(element));
        }
    };

    MoengageService.prototype.dispatchEventManually = function(ctid, targeted_element=null) {
        if ( ctid && this.eventData[ctid] ) {
            var element               = this.eventData[ctid];
            this.pushEvent(element.event_name, this.buildEventData(element, targeted_element));
        }
    };

    MoengageService.prototype.transform_ca_assisted_screen_name = function() {
        return $(".wizard-step.active").data("screen-name");
    };

    MoengageService.prototype.transform_fiy_basic_details_gender = function() {
        return $("input[name=gender]:checked").val() == 'M' ? 'male' : 'female';
    };

    MoengageService.prototype.transform_guide_page_guide_name = function() {
        return $('h1').text();
    };

    MoengageService.prototype.transform_regime_button = function() {
        return $("#new_regime_radio").is(':checked') ? 'yes' : 'no';
    };

    MoengageService.prototype.transform_upload_form16_next_part = function() {
        var part_uploaded = $('div[data-bs-target="#file-1"]').attr('data-part-uploaded');
        return part_uploaded == "A" ? "B" : "A";
    };

    MoengageService.prototype.transform_upload_form16_type = function() {
        if($('#file-1').prop('files')[0] != undefined  && $('#file-2').prop('files')[0] != undefined) {
            return "AB";
        }
        else {
            return $('div[data-bs-target="#file-1"]').attr('data-part-uploaded');
        }
    };

    MoengageService.prototype.transform_pay_tax = function() {
        return this.pay_tax;
    };

    MoengageService.prototype.transform_pre_fill_data = function() {
        return $("#prefill_itr_yes").is(':checked') ? 'yes' : 'no';
    };

    MoengageService.prototype.transform_auth_type = function() {
        return window.everificationService && window.everificationService.e_verification_mode || null;
    };

    MoengageService.prototype.transform_social_login_page = function(){
        var page_value =  window.location.pathname.replace(/[^_\w\s-]/gm, '').replace(/(\s|-|_)+/g, '_').toLowerCase();
        return page_value.length ? page_value : 'home';
    }

    MoengageService.prototype.transform_contact_form_page_title = function(){
        return window.location.pathname.replace(/(guide|\/|\n)|([^\w\s-])/gm, '').replace(/(\s|-|_)+/g, '_').toLowerCase();
    }
    MoengageService.prototype.transform_contact_form_button_value = function(element, targeted_element){
        return (targeted_element.val().length ? targeted_element.val() : targeted_element.text()).replace(/[^\w\s-]/gm, '').trim().replace(/(\s|-|_|\n)+/gm, '_').toLowerCase();
    }

    MoengageService.prototype.pushIdentity = function() {
        if ( this.logged_in ) {
            Moengage.add_unique_user_id(this.user.id);
            if (this.user.first_name) {
                Moengage.add_first_name(this.user.first_name);
            }
            if (this.user.last_name) {
                Moengage.add_last_name(this.user.last_name);
            }
            if (this.user.email) {
                Moengage.add_email(this.user.email);
            }
            if (this.user.mobile) {
                Moengage.add_mobile(this.user.mobile ? '+91' + this.user.mobile.toString() : '');
            }
            if (this.user.name) {
                Moengage.add_user_name(this.user.name); // Full name for user
            }
            if (this.user.gender) {
                Moengage.add_gender(this.user.gender);
            }
            if (this.user.dob) {
                Moengage.add_birthday(new Date(this.user.dob));
            }
            var skip = ['id', 'first_name', 'last_name', 'email', 'mobile','name', 'gender', 'dob'];
            for (var key in this.user) {
                if (skip.indexOf(key) == -1) {
                    value = this.user[key];
                    if (value) {
                        Moengage.add_user_attribute(key, value);
                    }
                }
            }
        } else{
            this.check_moe_logged_in_user();
        }
    };

    MoengageService.prototype.check_moe_logged_in_user = function() {
        this.moe_user_check_attempts ++;
        if (Moengage.user) {
            try {
                if ( Moengage.user.getAttributes().USER_ATTRIBUTE_UNIQUE_ID != undefined ) {
                    Moengage.destroy_session();
                    return;
                }
            } catch (error) {
                
            }
        } 
        
        if ( this.moe_user_check_attempts < 3 ) {
            window.setTimeout(this.check_moe_logged_in_user.bind(this), 1000);
        }
    }

    MoengageService.prototype.pushIdentityAfterLogin = function(user) {
        this.logged_in = true;
        this.user_login_status  = 'logged_in_user';
        this.user = {
            'id'          : user.id,
            'first_name'  : user.first_name,
            'last_name'   : user.last_name,
            'name'        : user.name,
            'mobile'      : user.mobile,
            'email'       : user.email,
            'partner_name': user.partner_name,
        };
        this.pushIdentity();
    };

    MoengageService.prototype.pushEvent = function(event_name, attributes) {
        Moengage.track_event(event_name, attributes);
    };

    MoengageService.prototype.askForNotification = function() {
        window.setTimeout(function(){
            clevertap.notifications.push({
                titleText:'Turn on notifications?',
                bodyText:'Get the latest updates on tax filing, savings, rewards & more',
                okButtonText:'Yes, please',
                rejectButtonText:'No, thanks',
                okButtonColor:'#56ba4b',
                askAgainTimeInSeconds:172800,
                serviceWorkerPath: '/assets-new/js/clevertap_sw.js'
            });
        }, 10000);
    };

    MoengageService.prototype.pushPendingCtEvents = function() {
        for ( key in this.ct_event) {
            this.pushEvent(key, this.ct_event[key]);
        }
    };

    return MoengageService;
}());