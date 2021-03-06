$(document).ready(function(){

    var $DOMAIN = "localhost:1234";

    var $COOKIE_PREFS = "tuneefyPrefs";
    var $COOKIE_HELP = "tuneefyHelpBox";
    var $COOKIE_SEARCH = "tuneefySearchType";

    var searchForm = $("#find");
    var queryField = $("#query");
    var queryLabel = queryField.attr('data-placeholder');
    var searchButton = $("#launch");
    var strictModeCheckBox = $("#aggressive");
    var searchTypeCheckBox = $("#searchTypeCheckbox");
    var optionsButton = $("#options");
    var advanced = $("#advanced,#hideMisere");
    var platforms = $("a.btns");
    var searchForIt = $(".searchForIt");
    var alertsDiv = $("#alerts");
    var closeHelp = $("span.closeHelp");
    var closeForever = $("span.closeForever");
    var resetField = $("#resetQuery");

    var resultsDiv = $("#results");
    var resultsList = $("#results ul");
    var resultsNumber = $(".nbResults");
    var waitingDiv = $("#waiting");
    var paginators = $("a.tPagerNext img, a.tPagerPrev img, .tPagerPage");

    var selectedPlatforms = "";

    // Re-enable the button in case and cleanse platforms checkBoxes
    searchButton.removeAttr('disabled');
    platforms.removeAttr('on');

    // Special iphone-like button for merge albums & tracks/albums switch
    if (typeof $.iphoneStyle === 'function') {

        // Merge Albums
        strictModeCheckBox.iphoneStyle({
            checkedLabel: strictModeCheckBox.attr('data-yes'),
            uncheckedLabel: strictModeCheckBox.attr('data-no'),
            resizeContainer: false,
            resizeHandle: false
        });

        // Tracks or Albums
        searchTypeCheckBox.iphoneStyle({
            checkedLabel: "",
            uncheckedLabel: "",
            resizeContainer: false,
            resizeHandle: false,
            containerClass: 'iPhoneCheckContainer otherContainer',
            labelOnClass: 'iPhoneCheckLabelOn albums',
            labelOffClass: 'iPhoneCheckLabelOff tracks',
            handleClass: 'iPhoneCheckHandle otherHandle',
            handleCenterClass: 'iPhoneCheckHandleCenter noBG',
            handleRightClass: 'iPhoneCheckHandleRight activeTracks',
            containerRadius: 2,
            onChange: function() {
                var value;
                if (searchTypeCheckBox.is(':checked')) {
                    // track 
                    $('#typeTracks').removeClass('off');
                    $('#typeAlbums').addClass('off');
                    $('.iPhoneCheckHandleRight.activeAlbums').addClass('activeTracks');
                    $('.iPhoneCheckHandleRight.activeAlbums').removeClass('activeAlbums');

                    // COOKIE_SEARCH
                    value = $COOKIE_SEARCH + "=tracks; ";
                    value += "expires=Sat, 01 Feb 2042 01:20:42 GMT; path=/; domain= " + $DOMAIN + ";";
                    document.cookie = value;
                } else {
                    // album 
                    $('#typeTracks').addClass('off');
                    $('#typeAlbums').removeClass('off');
                    $('.iPhoneCheckHandleRight.activeTracks').addClass('activeAlbums');
                    $('.iPhoneCheckHandleRight.activeTracks').removeClass('activeTracks');

                    // COOKIE_SEARCH
                    value = $COOKIE_SEARCH + "=albums; ";
                    value += "expires=Sat, 01 Feb 2042 01:20:42 GMT; path=/; domain= " + $DOMAIN + ";";
                    document.cookie = value;
                }
            }

        });
    }

    $(document).on('.closeAlert', "click", function() {
        $(this).parent().fadeOut();
    });

    // Gets the cookie to initially set the platforms
    var cookieValue = document.cookie.split($COOKIE_PREFS + '=')[1] || "";

    if (cookieValue === "") {
        cookieValue = $default_platforms;
    } else {
        cookieValue = decodeURIComponent(cookieValue.split(';')[0]);
    }

    selectedPlatforms = cookieValue;

    var arrayCookieContent = cookieValue.split(',');
    $.each(arrayCookieContent, function(index, pltf) {
        $('#platform_' + pltf).attr('on', 'yes').removeClass("off");

    });

    // Gets the cookie for the 'tracks' vs 'albums' preference
    cookieValue = document.cookie.split($COOKIE_SEARCH + '=')[1] || "";

    if (cookieValue !== null) {
        if (cookieValue.split(";")[0] === 'albums') {
            searchTypeCheckBox.click();
        }
    }


    /******* SEARCH INITIATED *******/
    searchForm.submit(function(e) {

        e.preventDefault();

        $(".hideAll").fadeOut();
        advanced.hide();
        optionsButton.removeClass('shd');

        // We get the values
        var queryString = $.trim(queryField.val()),
            strictMode = strictModeCheckBox.is(':checked');

        // Do we search for tracks or albums ? 0 = track, 1 = album
        var itemType = searchTypeCheckBox.is(':checked') ? 'track' : 'album';

        // Has the user entered something interesting as a query ?
        if (queryString === "" || queryString === queryLabel || selectedPlatforms === "") {
            return false;
        }

        searchButton.attr('disabled', 'disabled');

        resultsDiv.hide();
        resultsList.find('.tResult').remove();
        waitingDiv.show();
        alertsDiv.empty();
        $('.tHeader_disp').hide();

        console.log("Searching for " + itemType + "s with query '" + queryString + "' on " + selectedPlatforms + " (strict: " + strictMode + ").");

        var url = searchForm.attr("action").replace('%type%', itemType);
        var params = {q: queryString, aggressive: strictMode, include: selectedPlatforms};
        url = url+"?"+$.param(params);

        var jqxhr = $.get(url)
          .done(function(data) {
            if (data.errors && data.errors.length > 0) {
                for (var i = 0; i < data.errors.length; i++) {
                    alertsDiv.append("<span class='alert' ><div class=\"triangle\"></div>" + Object.values(data.errors[0])[0] + "<span class='closeAlert'></span></span>");
                }
                alertsDiv.children().last().fadeIn();
            }
            if (data.results) {
                resultsNumber.html($results_found.replace('%query%', queryString).replace('%type%', itemType).replace('%number%', data.results.length));
                // Display correct headers
                $('.tHeader_disp[rel='+itemType+']').show();
                Twig.twig({
                    href: "js/twig/result.html.twig",
                    async: true,
                    load: function(template) {
                        for (var key in data.results){
                            var item = data.results[key]
                            resultsList.append(template.render({
                                type: itemType,
                                item: item.musical_entity,
                                share: $share,
                                listenTo: $listen_to.replace('%name%', item.musical_entity.safe_title),
                                shareTip: $share_tip.replace('%name%', item.musical_entity.safe_title),
                                linkDirect: $path
                            })); 
                        }
                        resultsDiv.show();
                    }
                });
            } else {
                // Some other problem
                alertsDiv.append("<span class='alert' ><div class=\"triangle\"></div>" + $error_message + "<span class='closeAlert'></span></span>");
                alertsDiv.children().last().fadeIn();
            }
          })
          .fail(function() {
            alertsDiv.append("<span class='alert' ><div class=\"triangle\"></div>" + $error_message + "<span class='closeAlert'></span></span>");
            alertsDiv.children().last().fadeIn();
          })
          .always(function() {
            waitingDiv.hide();
            searchButton.removeAttr('disabled');
            queryField.blur();
            $('html,body').animate({
                scrollTop: resultsList.offset().top - 20
            }, "slow");
          });
    });


    /******* QUERY INPUT ON FOCUS AND BLUR *******/
    queryField.click(function(e) {

        if (queryField.val() === queryLabel) {
            queryField.val("");
        }

        $(e.target).select();
        $("#basic").addClass("focused");
        $(".hideAll").fadeTo(500, 0.5);

        // Gets the cookie for the 'never again' preference
        var cookieValue = document.cookie.split($COOKIE_HELP + '=')[1];

        if (cookieValue === null) {
            $("#help").fadeIn();
        }

        e.stopPropagation();

    });

    /******* CLICK IN HELP *******/
    searchForIt.click(function(e) {
        queryField.val($(e.target).html());
        searchForm.submit();
    });

    /******* RESET BUTTON *******/
    queryField.keyup(function() {
        if (queryField.val() !== queryLabel && $.trim(queryField.val()).length !== 0) {
            resetField.show();
        } else {
            resetField.hide();
        }
    });

    resetField.click(function(e) {
        queryField.val("");
        queryField.focus();
        resetField.hide();
        e.stopPropagation();
    });

    /******* CLOSE HELP *******/
    closeHelp.click(function(e) {
        $("#help").fadeOut();
        queryField.focus();
        e.stopPropagation();
    });

    /******* CLOSE FOREVER HELP *******/
    closeForever.click(function(e) {
        // Sets the cookie_help
        var value = $COOKIE_HELP + "=neverAgain; ";
        value += "expires=Sat, 01 Feb 2042 01:20:42 GMT; path=/; domain= " + $DOMAIN + ";";
        document.cookie = value;
        $("#help").fadeOut();
        queryField.focus();
        e.stopPropagation();
    });

    /******* OPTIONS *******/
    optionsButton.click(function(e) {
        advanced.toggle();
        optionsButton.toggleClass('shd');
        e.stopPropagation();
    });

    // When we blur() outside the advanced options div, we must close it
    $(".hideAll").click(function() {}); // Trick for iPhone bug http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
    $('html').click(function() {
        // Hiding advanced options
        advanced.hide();
        optionsButton.removeClass('shd');

        // removing the halo
        $("#basic").removeClass("focused");
        $(".hideAll").fadeOut();

        // Hiding help
        $("#help").fadeOut();

        // Filling with help text
        if (queryField.val() === "") {
            queryField.val(queryLabel);
        }
    });

    // In case we click inside the options div, we must not close it
    advanced.click(function(e) {
        e.stopPropagation();
    });

    /******* A CHECKBOX (image) IS CLICKED *******/
    platforms.click(function(e) {

        if ($(e.target).attr("on") === "yes") {
            $(e.target).attr("on", "no");
            $(e.target).addClass("off");
        } else {
            $(e.target).attr("on", "yes");
            $(e.target).removeClass("off");
        }

        // Which platforms did he choose ?
        var tempSelectedPlatforms = [];

        platforms.each(function() {
            if ($(this).attr("on") === "yes") {
                tempSelectedPlatforms.push($(this).attr("rel"));
            }
        });
        selectedPlatforms = tempSelectedPlatforms.toString();

        // Sets the cookie
        var value = $COOKIE_PREFS + "=" + encodeURIComponent(selectedPlatforms) + "; " + "expires=Sat, 01 Feb 2042 01:20:42 GMT; path=/; domain= " + $DOMAIN + ";";

        document.cookie = value;

    });

});
