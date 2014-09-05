var dropIDs = [], dropIDsImp = [];
var memdatauid, sourceurl = window.location.href;
var xoapikey = "39wnzksyn4kuewzxhqgacm86t8xtrur2cjq";
var d = new Date();
var debug = true;

//loading mask param str: 'show' / 'hide'
function loadingMask(param) {
    var loadingNode = '<div id="loadingMask" style="width: 100%;height: 100%;background: rgba(255,255,255,0.6) url(http://www.xoedge.com/gateway/071114/loading.gif) center no-repeat;position: fixed;top: 0;left: 0;right: 0;bottom: 0;z-index: 9999;text-align: center;"></div>';

    if (param === 'show') {
        if ($('#loadingMask').length === 0) {
            $('body').append(loadingNode);
        }
    } else if (param == 'hide') {
        if ($('#loadingMask').length > 0) {
            $('#loadingMask').remove();
        }
    }
}

function isOrigin() {
    if ((tkjs.queryString.hasOwnProperty('origin') && tkjs.queryString.origin !== 'modal') || !tkjs.queryString.hasOwnProperty('origin')) {
        return true;
    } else {
        return false;
    }
}

function offerImpression(dropID) {
    $.ajax({
        type: 'POST',
        url: '/apiproxy/offersuite/v1/offers/impression',
        data: { DropIds: dropID, SiteID: XO.siteInfo.siteId, Source: window.location.href },
        dataType: 'json',
        cache: false
    });
}

function closeOverlay() {
    $("#gatewayLayer").hide();
    $("#gatewayOverlay").hide();
}
function continueToSite() {
    loadingMask('hide');
    if (XO.queryString.target !== "" && XO.queryString.target !== null) {
        window.location = XO.queryString.target;
    } else {
        window.location = XO.siteInfo.link;
    }
}


function gatewayOptin(dropIDs, btn) {
    loadingMask('show');
    XO.membership.member({
        apikey: xoapikey
    },{
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            memdatauid = data.MemberDataEntity.UserIdString;
            if (window.location.href.indexOf('?') > -1) {
                sourceurl += "&btn=" + btn;
            } else {
                sourceurl += "?btn=" + btn;
            }
            $.ajax({
                type: 'POST',
                url: '/apiproxy/offersuite/v1/offers/optin',
                data: { DropIds: dropIDs, UserID: memdatauid, SiteID: XO.siteInfo.siteId, Source: sourceurl },
                dataType: 'json',
                cache: false,
                success: function () {
                    continueToSite();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    loadingMask('hide');
                    if (jqXHR.status === 409) {
                        $("#gatewayOverlay").html("<p>Oops! You already opted in for these offers.</p><a class='continue'>Continue</a>").show();
                    } else {
                        $("#gatewayOverlay").html("<p>" + jqXHR.responseText + "</p><a class='continue'>Continue</a>").show();
                    }
                }
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            loadingMask('hide');
            $("#gatewayOverlay").html("<p>" + errorThrown + "</p><a class='continue'>Continue</a>").show();
        },
        jsonp: "jsonp"
    });
}

// get selected offer, and send analytics track
function selectedTrack(callback) {
    var oSlot = $('.li_input:checked').parents('.li_offer').parent().parent(),
        sNub,
        iOffer = $('.li_input').length;
    if (oSlot.length > 0) {
        for (var i = 0; i < oSlot.length; i++) {
            sNub = oSlot[i].id.substr(20);
            analytics.track('Gateway Offer Selected', {
                product: 'theknot.com',
                platform: 'web',
                mobile: 'false',
                adTier: sNub,
                offersCount:iOffer
            });
        }
        if (callback) { callback(); }
    } else {
        if (callback) { callback(); }
    }
}

//page analytics track fn
function pageTrack(callback) {
    var reason = "voluntary";
    if (!isOrigin()) reason = 'gated';
    analytics.page('Gateway Offers', {
        reason: reason,
        platform: 'web',
        mobile: 'false',
        product: tkjs.siteInfo.domain
    }, function () {
        if (debug) { console.log('pageTrack callback'); }
        if (callback) { callback(); }
    });
}

//log inmpressions of all offers presented on the page
if ($('.li_input[type=checkbox]') != "" && $('.li_input[type=checkbox]') != null && $('.li_input[type=checkbox]').length>0) {
    $('.li_input[type=checkbox]').each(function () {
        dropIDsImp.push(Number($(this).attr('id')));
    });
    offerImpression(dropIDsImp);
}

$('#gatewayOverlay').delegate('.goback', 'click', function (event) {
    closeOverlay();
});

$('#gatewayOverlay').delegate('.continue', 'click', function (event) {
    if (isOrigin()) {
        if (debug) { console.log('Continue: Origin,pageTrack'); };
        pageTrack(continueToSite);
    } else {
        if (debug) { console.log('Continue: not Origin,no pageTrack'); }
        continueToSite();
    }
});
$('#gatewayOverlay').delegate('.continueNo', 'click', function (event) {
    if (debug) { console.log('ContinueNo: pageTrack'); };
    pageTrack(continueToSite);
});

$('#header_a').click(function () {
    var reason = "voluntary";
    if (!isOrigin()) reason = 'gated';
    analytics.track('Gateway Offers Interaction', {
        selection: 'Header Logo Click',
        reason: reason,
        platform: 'web',
        mobile: 'false',
        product: tkjs.siteInfo.domain
    }, function () {
        if (debug) { console.log('header track sent:[Header Logo Click]') };
    });

})

$('.thanks-link').click(function () {
    var reason = "voluntary";
    if (!isOrigin()) reason = 'gated';
    pageTrack();
    analytics.track('Gateway Offers Interaction', {
        selection: 'Skip Selected',
        reason: reason,
        platform: 'web',
        mobile: 'false',
        product: tkjs.siteInfo.domain
    }, function () {
        if (debug) { console.log('thanks-link track sent:[Skip Selected]') };
        continueToSite();
    });
        
});

$('.li_input[type=checkbox]').click(function () {
    if ($(this).is(":checked")) {
        $(this).closest(".li_offer").addClass("blueborder");
    } else {
        $(this).closest(".li_offer").removeClass("blueborder");
    }
})

$('.li_img_pc, .li_con').click(function () {
    if ($(this).closest('.li_offer').find('.li_input[type=checkbox]').is(":checked")) {
        $(this).closest('.li_offer').find('.li_input[type=checkbox]').prop("checked", false);
        $(this).closest('.li_offer').removeClass("blueborder");
    } else {
        $(this).closest('.li_offer').find('.li_input[type=checkbox]').prop("checked", true);
        $(this).closest('.li_offer').addClass("blueborder");
    }
})

//send all offers
$("body").delegate(".send_offer", "click", function () {
    pageTrack(function () {
        var reason = "voluntary";
        if (!isOrigin()) reason = 'gated';
        analytics.track('Gateway Offers Interaction', {
            selection: 'Top Offers Selected',
            reason: reason,
            platform: 'web',
            mobile: 'false',
            product: tkjs.siteInfo.domain
        }, function () {
            if (debug) { console.log('send_offer track sent:[Top Offers Selected]') };
        });
    });
    dropIDs = [];
    var callback = function () {
        $('.li_input[type=checkbox]').each(function () {
            dropIDs.push(Number($(this).attr('id')));
        });
        $('input:checkbox').attr('checked', true);
        selectedTrack(function () { gatewayOptin(dropIDs, 'send_all'); });
    }
    if (isOrigin()) {
        callback();
    } else {
        $.fn.popupSave({ onSuccess: function () {
            callback();
        } });
        
    }
});

//send selected offers
$("body").delegate('.send_selected', "click", function () {
    dropIDs = [];
    $('.li_input[type=checkbox]').each(function () {
        if ($(this).is(":checked")) {
            dropIDs.push(Number($(this).attr('id')));
        }
    })
    if (dropIDs != null && dropIDs != "") {
        pageTrack(function () {
            var reason = "voluntary";
            if (!isOrigin()) reason = 'gated';
            analytics.track('Gateway Offers Interaction', {
                selection: 'Bottom Offers Selected',
                reason: reason,
                platform: 'web',
                mobile: 'false',
                product: tkjs.siteInfo.domain
            }, function () {
                if (debug) { console.log('send_selected track sent:[Bottom Offers Selected]') };
            });
        });
        if (isOrigin()) {
            selectedTrack(function () { gatewayOptin(dropIDs, 'send_selected'); });
        } else {
            $.fn.popupSave({
                onSuccess: function () {                    
                    selectedTrack(function () { gatewayOptin(dropIDs, 'send_selected'); })
                }
            });
        }
    } else {
        $("#gatewayOverlay").html("<p>Oops! You didn't select any offers.</p><div class='goback'>Go Back</div><a class='continueNo'>Continue</a>").show();
    }

});

//Get current year for Copyright statement
$('#currYr').html(d.getFullYear());

// Saveinfo

(function ($, standardModal, membership) {

    var popupWin,
    errorMes = '',
    opts = { onSuccess: function () { } }
    container = $('<div style="margin:20px auto 40px; color: grey; display: block;font-family: Arial;font-size: 14px;width: 455px;">').append('<title>').html('<div class="popup_header"><a href="http://www.theknot.com/" target="_blank"><img src="http://www.xoedge.com/css/tk/mobile/4x/TK_logo@4x.png" alt="siteLogo"></a><p class="">Personalize your deals</p><p class="">(last step - promise!)</p></div>'),
    form = $('<form style="width: 100%; margin: auto;">'),
    firstName = $('<p style=" float: left; width: 45%;"><input placeholder="First name" required id = "saveinfo-firstName" type="text" style=" padding: 10px; margin: 0 auto 20px;width: 100%;"></p>'),
    lastName = $('<p style=" float: right; width: 45%;"><input placeholder="Last name" required id = "saveinfo-lastName" type="text" style=" padding: 10px; margin: 0 auto 20px;width: 100%;"></p>'),
    address = $('<p style=" float: left; width: 45%;"><input placeholder="Address" required id = "saveinfo-address" type="text" style=" padding: 10px; margin: 0 auto 20px;width: 100%;"></p>'),
    zipcode = $('<p style=" float: right; width: 45%;"><input placeholder="Zip code" required id = "saveinfo-zipcode" type="text" style=" padding: 10px; margin: 0 auto 20px;width: 100%;"></p>'),
    submit = $('<div><input disabled="disabled" style="outline: none; cursor: default; background: gainsboro;color: white;font-size: 18px;border: 1px;border-radius: 5px;padding: 6px 10px;margin: 10px;" id = "saveinfo-saveBtn" type="button" value="CONTINUE"></div>'),
    privacy = $('<p class="privacy">By clicking Continue, you agree to our <a href="http://wedding.theknot.com/wedding-tools-help-center/the-knot-about-us/articles/the-knot-privacy-policy.aspx" target="_blank">privacy policy</a>.</p>');
    form.append(firstName, lastName, address, zipcode, submit, privacy);
    container.append(form);

    /*var popupNode = [];
    popupNode.push('<div class="gate_header">');
    popupNode.push('<a href="http://m.theknot.com/" target="_blank"><img src="http://www.xoedge.com/css/tk/mobile/4x/TK_logo@4x.png" alt="siteLogo"/></a>');
    popupNode.push('<p class="subheadFont">Personalize your deals<br>(last step - promise!)</p></div>');
    popupNode.push('<form class="input-group">');
    popupNode.push('<fieldset class="form_half">');
    popupNode.push('<input type="text" id="saveinfo-firstName" class="form-control" placeholder="First Name" required /></fieldset>');
    popupNode.push('<fieldset class="form_half">');
    popupNode.push('<input type="text" id="saveinfo-lastName" class="form-control" placeholder="Last Name" required /></fieldset>');
    popupNode.push('<fieldset class="form_half">');
    popupNode.push('<input type="text" id="saveinfo-address" class="form-control" placeholder="Address" required ></fieldset>');
    popupNode.push('<fieldset class="form_half">');
    popupNode.push('<input type="text" id="saveinfo-zipcode" class="form-control" placeholder="Zip Code" required></fieldset>');
    popupNode.push('<fieldset class="form_full">');
    popupNode.push('<input type="button" id="saveinfo-saveBtn" class="btn btn-primary" disabled="disabled" value="CONTINUE" style="width:100%"></fieldset></form>');
    popupNode.push('<p class="privacy">By clicking Continue, you agree to our <a href="http://wedding.theknot.com/wedding-tools-help-center/the-knot-about-us/articles/the-knot-privacy-policy.aspx" target="_blank">privacy policy</a>.</p>');
    popup.html(popupNode.join(''));
    var $container = $(popup);*/

    $.fn.extend({ popupSave: function (obj) {
        $.fn.extend(opts, obj);
        if ((tkjs.queryString.hasOwnProperty('origin') && tkjs.queryString.origin != 'modal') || !tkjs.queryString.hasOwnProperty('origin')) {
            //return;
        }
        popupWin = standardModal.makeModal('test', {
            content: container,
            width: 600,
            height: 'auto',
            showOverlay: true,
            overlayOpacity: 0.0,
            closeDestroysModal: true,
            useStandardClose: false,
            showBorder: false,
            centerModalVertically: true,
            useTrueVerticalCenter: true,
            manualOffsetY: -100,
            showThickBorder: false,
            showDropShadow: true,
            events: {
                onClose: function () { },
                onCreate: function () { checkIE() }
            }
        });
        init();
    }
    });

    var init = function () {
        ZIP_NUB_REGEXP = /^\d{5}$/;
        ZIP_CANADAIN_REGEXP = /^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] [0-9][A-Z][0-9]$|^(?!.*[DFIOQU])[A-VXY][0-9][A-Z][0-9][A-Z][0-9]$/;
        STR_ADS = /^([a-zA-Z0-9.\s'\-]{1,100})$/;
        STR_NAME = /^([a-zA-Z.\s'\-]{1,50})$/;
        //ZIP_CODE = /^((Zip)|(\d{5}|\d{5}-\d{4})|([ABCEGHJKLMNPRSTVXYabceghjklmnprstvxy]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}))$/;
        $('#saveinfo-firstName, #saveinfo-lastName, #saveinfo-address, #saveinfo-zipcode').bind('input propertychange', function (e) {
            var _firstName = $.trim($('#saveinfo-firstName').attr('value'));
            var _lastName = $.trim($('#saveinfo-lastName').attr('value'));
            var _address = $.trim($('#saveinfo-address').attr('value'));
            var _zipcode = $.trim($('#saveinfo-zipcode').attr('value'));

            if (STR_NAME.test(_firstName) && STR_NAME.test(_lastName) && STR_ADS.test(_address) && (ZIP_NUB_REGEXP.test(_zipcode) || ZIP_CANADAIN_REGEXP.test(_zipcode.toUpperCase()))) {
                $('#saveinfo-saveBtn').removeAttr('disabled');
                $('#saveinfo-saveBtn').css({ background: '#8AD2F3', cursor: 'pointer' });
            } else {
                $('#saveinfo-saveBtn').attr('disabled', 'disabled');
                $('#saveinfo-saveBtn').css({ background: 'gainsboro', cursor: 'default' });
            }
        });
        $('#saveinfo-saveBtn').on('click', function (e) {
            analytics.track('Gateway Offers Name Prompt', {
                selection: 'Continue Click',
                reason: 'gated',
                platform: 'web',
                mobile: 'false',
                product: tkjs.siteInfo.domain
            });
            $('#saveinfo-saveBtn').attr('disabled', 'disabled');
            $('#saveinfo-saveBtn').css({ background: 'gainsboro', cursor: 'default' });
            $('#saveinfo-firstName, #saveinfo-lastName, #saveinfo-zipcode, #saveinfo-address').attr('disabled', 'disabled');
            save();
        })
        $('#skipOffersModalLink').on('click', function () {
            analytics.track('Gateway Offers Name Prompt', {
                selection: 'No Thanks Click',
                reason: 'gated',
                platform: 'web',
                mobile: 'false',
                product: tkjs.siteInfo.domain
            });
            opts.onSuccess();
            popupWin.close();
        })
        $('.xo_stdModalClose').on('click', function () {
            analytics.track('Gateway Offers Name Prompt', {
                selection: 'Close Modal Clicked',
                reason: 'gated',
                platform: 'web',
                mobile: 'false',
                product: tkjs.siteInfo.domain
            });
        })
    }

    //fixed the IE 9 placehoder issuse;
    var checkIE = function () {
        if (navigator.userAgent.indexOf("MSIE 9.0") > 0) {
            console.log('current browser was IE9.');
            $.fn.extend({ textPlaceholder: function (str) {
                var text = str, $that = $(this); $that.val(text);
                this.focus(function () { if ($that.val() === str) $that.val(''); });
                this.blur(function () { if ($that.val() === '') $that.val(text); });
            }
            });
            $('#saveinfo-firstName').textPlaceholder('First name');
            $('#saveinfo-lastName').textPlaceholder('Last name');
            $('#saveinfo-address').textPlaceholder('Address');
            $('#saveinfo-zipcode').textPlaceholder('Zip code');
        }
    }

    var save = function () {
        var _firstName = $.trim($('#saveinfo-firstName').attr('value'));
        var _lastName = $.trim($('#saveinfo-lastName').attr('value'));
        var _address = $.trim($('#saveinfo-address').attr('value'));
        var _zipcode = $.trim($('#saveinfo-zipcode').attr('value'));
        loadingMask('show');
        membership.memberUpdate({}, {
            jsonp: "jsonp",
            apikey: '3a6b41d1694886f1349a9ccde0682f81',
            data: { "memberData": {
                "FirstName": _firstName,
                "LastName": _lastName,
                "Addresses": [{
                    "Line1": _address,
                    "Zip": _zipcode.toUpperCase(),
                    "AddressType": "1"
                }]
            }
            },
            success: function (data, textStatus, jqXHR) {
                opts.onSuccess();
                popupWin.close();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                loadingMask('hide');
                $("#gatewayOverlay").html('<p>' + errorThrown + '</p><a class="continue">Continue</a>');
                $("#gatewayOverlay").show();
                console.log('XHR: ', jqXHR);
                console.log('Status: ', textStatus);
                console.log('Error: ', errorThrown);
            }
        });
    }

})($, XO.standardModal, XO.membership);
