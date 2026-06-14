(function ($, window) {
    'use strict';
    wglElementorExtensions();

    $(window).on('elementor/frontend/init', function () {
        wglExtensionsParallax();
        wglExtensionsEditorStyle();
        wglExtensionsColumn();
    });

    $(window).on('load', function () {
        if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
            ScrollTrigger.refresh();
        }
    });

    function wglExtensionsParallax(){
        function WGLSectionParallax($scope) {
            $scope.WGLSectionParallaxInit();
            $scope.WGLSectionParallaxColInit();
            $scope.WGLSectionParticlesInit();
            $scope.WGLSectionParticlesImageInit();
            $scope.WGLSectionDynamicHighlightsInit();
            $scope.WGLSectionHoverHighlightsInit();
            $scope.WGLSectionMorphInit();
            $scope.WGLSection3DWaveInit();
            $scope.WGLSectionShapeDividerInit();
            $scope.WGLSectionAnimateScrollInit();
            $scope.WGLSectionLayeredInit();
        }
        window.elementorFrontend.hooks.addAction('frontend/element_ready/section', WGLSectionParallax);
        window.elementorFrontend.hooks.addAction('frontend/element_ready/container', WGLSectionParallax);
    }

    function wglExtensionsEditorStyle(){
        if(wgl_parallax_settings.elementorPro){
            return;
        }

        var globaPageSettings = true;

		elementorFrontend.hooks.addFilter('editor/style/styleText', addCustomCss);
		if(window.elementorFrontend.isEditMode()){
			elementorFrontend.hooks.addAction('frontend/element_ready/global', elementReady);
			elementor.settings.page.model.on('change', changePageSettings);
		}

		function addCustomCss(css, context) {
			if (!context) {
				return;
			}
			var model = context.getEditModel(),
				customCSS = model.get('settings').get('custom_css');
			var selector = '.elementor-element.elementor-element-' + model.get('id');
			if ('document' === model.get('elType')) {
				selector = elementor.config.document.settings.cssWrapperSelector;
			}
			if (customCSS) {
				css += customCSS.replace(/selector/g, selector);
			}
			return css;
		}

		function elementReady($scope){
            return $scope.each(function () {
                var id = $(this).data('id');
				var obj = window.elementorFrontend.config.elements.data;

                Object.entries(obj).forEach(entry => {
                    const [key, value] = entry;

                    for (var prop in value._listeners) {
                        var dataID = value._listeners[prop].listener.$el.get(0).dataset.id;
                        if(id === dataID){
                            value.__itemID = dataID;

                            setTimeout(function () {
                                elementor.$previewContents.find('#elementor-style-' + value.__itemID).append(value.attributes.custom_css);
                            }, 1);

                            obj[key].on('change textInput input', onSettingsChange.bind(value));
                        }
                    }
                });

				if(globaPageSettings){
					var customCSS = elementor.settings.page.model.get('custom_css');
					if (customCSS) {
						customCSS = customCSS.replace(/selector/g, elementor.config.settings.page.cssWrapperSelector);
						elementor.settings.page.getControlsCSS().elements.$stylesheetElement.append(customCSS);
						globaPageSettings = false;
					}
				}
			});
		}

		function onSettingsChange($scope){
            Object.entries($scope).forEach(entry => {
				const [key, value] = entry;
                if(key === 'changed' && value.custom_css){
                    appendStyle($scope, value);
                }else if(key === 'attributes' && value.custom_css){
                    appendStyle($scope, value);
                }
			});
		}

        function appendStyle($scope, value){
            setTimeout(function(){
                var styleElement = jQuery('#elementor-style-' + $scope.__itemID).text();
                jQuery('#elementor-style-' + $scope.__itemID).empty().append(styleElement + value.custom_css);
            }, 1);
        }

		function changePageSettings() {
			var customCSS = elementor.settings.page.model.get('custom_css');
			if (customCSS) {
				customCSS = customCSS.replace(/selector/g, elementor.config.settings.page.cssWrapperSelector);
				setTimeout(function(){
					elementor.settings.page.getControlsCSS().elements.$stylesheetElement.append(customCSS);
				}, 1);
			}
		}
    }

    function wglExtensionsColumn(){
        if ( window.elementorFrontend.isEditMode() ) {
            window.elementorFrontend.hooks.addAction( 'frontend/element_ready/column',
                function( $scope ){
                    wglStickySidebar();
                }
            );
        }
    }

    function wglElementorExtensions (){

        jQuery.fn.is_visible = function (){
            var elementTop = jQuery(this).offset().top;
            var elementBottom = elementTop + jQuery(this).outerHeight();
            var viewportTop = jQuery(window).scrollTop();
            var viewportBottom = viewportTop + jQuery(window).height();
            return elementBottom > viewportTop && elementTop < viewportBottom;
        }

        jQuery.fn.wglGlobalVariables = function (globalSetting){
            var settings = {
                editorMode: window.elementorFrontend.isEditMode(),
                itemId: $(this).data('id'),
                options: false,
                globalVars: globalSetting,
                backEndVars: null,
                items: [],
            };

            return settings;
        }

        function findNodeItem(id, currentNode) {
            let i,
                currentChild,
                result;

            if (String(id) === String(currentNode.id)) {
                return currentNode;
            } else {
                for (i = 0; i < currentNode.attributes.elements.models.length; i += 1) {
                    currentChild = currentNode.attributes.elements.models[i];
                    result = findNodeItem(id, currentChild);
                    if (result !== false) {
                        return result;
                    }
                }
                return false;
            }
        }

        jQuery.fn.settingsEffectEnabled = function (option){
            var settings = {};


            if (!option.editorMode) {
                settings = wgl_parallax_settings[0][option.itemId];

                if (
                    settings
                    && (!settings.hasOwnProperty(option.globalVars)
                    || !settings[option.globalVars])
                ) {
                    return;
                }
            } else {

                if (
                    !window.elementor.elements
                    && !window.elementor.elements.models
                ) {
                    return;
                }

                window.elementor.elements.models.forEach(function (value) {
                    if(findNodeItem(option.itemId, value)){
                        option.backEndVars = findNodeItem(option.itemId, value).attributes.settings.attributes;
                    }
                });

                if (
                    option.backEndVars
                    && (!option.backEndVars.hasOwnProperty(option.globalVars)
                    || !option.backEndVars[option.globalVars])
                ) {
                    return;
                }

                settings = option.backEndVars;
            }

            return settings;
        }

        jQuery.fn.buildFront = function (option, value) {
            var settings = wgl_parallax_settings[0][option.itemId];
            settings = settings[value];
            return settings;
        }

        jQuery.fn.buildBackend = function (option, value) {
            if (!window.elementor.elements.models
                && !option.backEndVars.hasOwnProperty(value)
                )
            {
                return;
            }

            var arr = [];

            option.backEndVars[value].models.forEach(function (val) {
                arr.push(val.attributes);
            });

            return arr;
        }
    }

    // Add WGL Parallax Section
    $.fn.WGLSectionParallaxInit = function (options) {

        return this.each(function () {

            var self = $(this),
                wglParallax = self.wglGlobalVariables('add_background_animation');

            var init = function () {
                setParallaxItem();
            },
                setParallaxItem = function () {
                    var settings;

                    wglParallax.backEndVars = self.settingsEffectEnabled(wglParallax);

                    if (!wglParallax.backEndVars) {
                        return;
                    }

                    if (!wglParallax.editorMode) {
                        settings = self.buildFront(wglParallax, 'items_parallax');
                    } else {
                        settings = self.buildBackend(wglParallax, 'items_parallax');
                    }

                    if (!settings) {
                        return;
                    }

                    build(settings);
                    hideMobile();

                },

                appendElement = function (settings) {
                    var node_str = '';

                    if (settings.image_bg.url) {
                        node_str = '<div data-item-id="' + settings._id + '" class="extended-parallax elementor-repeater-item-' + settings._id + '">';

                        if (settings.parallax_image_mask_color) {
                            node_str += '<div class="wgl_mask_image" style="-webkit-mask-image:url(' + settings.image_bg.url + ');">';
                        }

                        node_str += '<img src="' + settings.image_bg.url + '" alt="' + settings.image_bg.alt + '"/>';

                        if (settings.parallax_image_mask_color) {
                            node_str += '</div>';
                        }

                        node_str += '</div>';
                    }

                    if (!$(self).find('.elementor-repeater-item-' + settings._id).length > 0) {
                        $(self).append(node_str);
                    }

                    wglParallax.items.push(settings);

                    var item = jQuery(self).find('.extended-parallax');
                    if (item.length !== 0) {
                        item.each(function () {
                            var $this = jQuery(this);
                            if (settings._id === $this.data('itemId')) {
                                if (settings.image_effect === 'mouse') {
                                    if (!$this.closest('.elementor-section').hasClass('wgl-parallax-mouse')) {
                                        $this.closest('.elementor-section').addClass('wgl-parallax-mouse');
                                    }
                                    if(!$this.closest('.e-con').hasClass('wgl-parallax-mouse')){
                                        $this.closest('.e-con').addClass('wgl-parallax-mouse');
                                    }

                                    $this.wrapInner('<div class="wgl-parallax-layer layer" data-depth="' + settings.parallax_factor + '"></div>');
                                } else if (settings.image_effect === 'scroll') {
                                    if (wglParallax.editorMode) {
                                        $this.paroller({
                                            factor: settings.parallax_factor,
                                            type: 'foreground',     // background, foreground
                                            direction: settings.parallax_dir, // vertical, horizontal

                                        });
                                        $this.css({ 'transform': 'unset' });
                                    } else {
                                        $this.paroller({
                                            factor: settings.parallax_factor,
                                            type: 'foreground',     // background, foreground
                                            direction: settings.parallax_dir, // vertical, horizontal

                                        });
                                    }
                                } else if (settings.image_effect === 'css_animation') {
                                    let self = $(this),
                                        image = self.find('img'),
                                        maskImage = self.find('.wgl_mask_image');

                                    self.addClass('wgl_animation_item');
                                    if (self.is_visible() && image.length !== 0) {
                                        if(maskImage.length !== 0) maskImage.addClass(settings.animation_name);
                                        else image.addClass(settings.animation_name);
                                    }
                                    jQuery(window).on('resize scroll', function () {
                                        if (self.is_visible() && image.length !== 0) {
                                            if(maskImage.length !== 0) maskImage.addClass(settings.animation_name);
                                            else image.addClass(settings.animation_name);
                                        }
                                    });
                                }
                            }
                        });

                        if (settings.image_effect === 'mouse') {
                            jQuery('.wgl-parallax-mouse').each(function () {
                                var scene = jQuery(this).get(0);
                                var parallaxInstance = new Parallax(scene, { hoverOnly: true, selector: '.wgl-parallax-layer', pointerEvents: true });
                            });
                        }
                    }
                },
                hideMobile = function () {
                    if (wglParallax.items) {
                        $.each(wglParallax.items, function (index, value) {
                            if (value.hide_on_mobile) {
                                if (jQuery(window).width() <= value.hide_mobile_resolution) {
                                    jQuery('.extended-parallax[data-item-id="' + value._id + '"]').css({ 'opacity': '0', 'visibility': 'hidden' });
                                } else {
                                    jQuery('.extended-parallax[data-item-id="' + value._id + '"]').css({ 'opacity': '1', 'visibility': 'visible' });
                                }
                            }
                        });
                    }
                },
                build = function (settings) {
                    $.each(settings, function (index, value) {
                        appendElement(value);
                    });
                };

            /*Init*/
            init();

            jQuery(window).resize(
                function () {
                    hideMobile();
                }
            );
        });
    };

    // Add WGL Parallax Section
    $.fn.WGLSectionParallaxColInit = function (options) {

        return this.each(function () {

            var self = $(this),
                settings,
                wglParallax = self.wglGlobalVariables('add_section_parallax');

            var init = function () {
                setParallaxItem();
            },
            setParallaxItem = function () {

                wglParallax.backEndVars = self.settingsEffectEnabled(wglParallax);

                if (!wglParallax.backEndVars) {
                    return;
                }

                if (!wglParallax.editorMode) {
                    settings = wgl_parallax_settings[0][wglParallax.itemId];
                } else {
                    settings = buildBackendSectionParallax().backEndVars;
                }

                if (!settings) {
                    return;
                }

                build(settings);

            },

            buildBackendSectionParallax = function () {
                if (!window.elementor.elements.models) return;

                return wglParallax;
            },

            appendElement = function (settings) {

                if (!settings) return;

                $(self).addClass('section_parallax');
                $(self).attr('data-paroller-factor-lg', settings.section_parallax_factor_tablet);
                $(self).attr('data-paroller-factor-md', settings.section_parallax_factor_tablet);
                $(self).attr('data-paroller-factor-sm', settings.section_parallax_factor_mobile);
                $(self).attr('data-paroller-factor-xs', settings.section_parallax_factor_mobile);

                if (wglParallax.editorMode) {
                    $(self).paroller({
                        factor: settings.section_parallax_factor,
                        type: 'foreground',     // background, foreground
                        direction: settings.section_parallax_dir, // vertical, horizontal
                    });
                    $(self).css({ 'transform': 'unset' });
                } else {
                    $(self).paroller({
                        factor: settings.section_parallax_factor,
                        type: 'foreground',     // background, foreground
                        direction: settings.section_parallax_dir, // vertical, horizontal
                    });
                }

            },
            build = function (settings) {
                appendElement(settings);
            };

            /*Init*/
            init();

        });
    };

    // Add WGL Particles Animation
    $.fn.WGLSectionParticlesInit = function (options) {
        return this.each(function () {

            var self = $(this),
                wglParallax = self.wglGlobalVariables('add_particles_animation');

            var init = function () {
                setParallaxItem();
            },
                setParallaxItem = function () {
                    var settings;

                    wglParallax.backEndVars = self.settingsEffectEnabled(wglParallax);

                    if (!wglParallax.backEndVars) {
                        return;
                    }

                    if (!wglParallax.editorMode) {
                        settings = self.buildFront(wglParallax, 'items_particles');
                    } else {
                        settings = self.buildBackend(wglParallax, 'items_particles');
                    }

                    if (!settings) {
                        return;
                    }

                    build(settings);
                    hideMobile();
                },
                appendElement = function (settings) {
                    var node_str = '',
                    $data_attr = '',
                    $style_attr = '';

                    $data_attr += ' data-particles-colors-type="' + settings.particles_effect + '"';
                    $data_attr += ' data-particles-number="' + settings.particles_count + '"';
                    $data_attr += ' data-particles-size="' + settings.particles_max_size + '"';
                    $data_attr += ' data-particles-speed="' + settings.particles_speed + '"';

                    if(settings.particles_line){
                        $data_attr += ' data-particles-line="true"';
                    }else{
                        $data_attr += ' data-particles-line="false"';
                    }

                    if(settings.particles_hover_animation === 'none'){
                        $data_attr += ' data-particles-hover="false"';
                        $data_attr += ' data-particles-hover-mode="grab"';
                    }else{
                        $data_attr += ' data-particles-hover="true"';
                        $data_attr += ' data-particles-hover-mode="' + settings.particles_hover_animation + '"';
                    }

                    if(settings.particles_effect !== 'random_colors'){
                        if(settings.particles_color_one){
                            $data_attr += ' data-particles-color="' + settings.particles_color_one + '"';
                        }
                    }else{
                        var $color_array = '';

                        if(settings.particles_color_one){
                            $color_array += settings.particles_color_one;
                        }
                        if(settings.particles_color_second){
                            $color_array += ',' + settings.particles_color_second;
                        }
                        if(settings.particles_color_third){
                            $color_array += ',' + settings.particles_color_third;
                        }

                        $data_attr += ' data-particles-color="' + $color_array + '"';
                    }

                    $data_attr += ' data-particles-type="particles"';

                    var style_array = ''
                    style_array += 'width:' + settings.particles_width + '%; ';
                    style_array += 'height:' + settings.particles_height + '%;';

                    $style_attr += ' style="' + style_array + '"';

                    node_str = '<div id="extended_' + settings._id + '" data-item-id="' + settings._id + '" class="wgl-particles-js particles-js elementor-repeater-item-' + settings._id + '"' + $data_attr + $style_attr + '>';
                    node_str += '</div>';


                    if (!$(self).find('.elementor-repeater-item-' + settings._id).length > 0) {
                        $(self).append(node_str);
                    }

                    var itemContainer = $(self).get(0);
                    $(itemContainer).addClass("wgl-row-animation");

                    wglParallax.items.push(settings);

                    var item = jQuery(self).find('.wgl-particles-js');
                    if (item.length !== 0) {
                        item.each(function () {
                            if (settings._id === jQuery(this).data('itemId')) {
                                //Call Particles WGL Theme
                                if(wglParallax.editorMode){
                                    wglParticlesCustom();
                                }else{
                                    // Dispatch a custom event
                                    const event = new CustomEvent("wglParticlesAdded");
                                    document.dispatchEvent(event);
                                }
                            }
                        });
                    }
                },
                hideMobile = function () {
                    if (wglParallax.items) {
                        $.each(wglParallax.items, function (index, value) {
                            if (value.hide_particles_on_mobile) {
                                if (jQuery(window).width() <= value.hide_particles_mobile_resolution) {
                                    jQuery('.wgl-particles-js[data-item-id="' + value._id + '"]').css({ 'opacity': '0', 'visibility': 'hidden' });
                                } else {
                                    jQuery('.wgl-particles-js[data-item-id="' + value._id + '"]').css({ 'opacity': '1', 'visibility': 'visible' });
                                }
                            }
                        });
                    }
                },
                build = function (settings) {
                    $.each(settings, function (index, value) {
                        appendElement(value);
                    });


                };

            /*Init*/
            init();

            jQuery(window).resize(
                function () {
                    hideMobile();
                }
            );
        });
    };

    // Add WGL Particles Image Animation
    $.fn.WGLSectionParticlesImageInit = function (options) {
        return this.each(function () {

            var self = $(this),
                wglParallax = self.wglGlobalVariables('add_particles_img_animation');

                var init = function () {
                    setParallaxItem();
                },
                setParallaxItem = function () {
                    var settings;

                    wglParallax.backEndVars = self.settingsEffectEnabled(wglParallax);

                    if (!wglParallax.backEndVars) {
                        return;
                    }

                    if (!wglParallax.editorMode) {
                        settings = self.buildFront(wglParallax, 'items_particles_img');
                    } else {
                        settings = self.buildBackend(wglParallax, 'items_particles_img');
                    }

                    if (!settings.length) {
                        return;
                    }

                    build(settings);
                    hideMobile();

                },

                appendElement = function (settings, uniqId) {

                    var node_str = '',
                    $data_attr = '',
                    $style_attr = '';

                    $data_attr += ' data-particles-number="' + wglParallax.backEndVars.particles_img_count + '"';
                    $data_attr += ' data-particles-speed="' + wglParallax.backEndVars.particles_img_speed + '"';
                    $data_attr += ' data-particles-color="' + wglParallax.backEndVars.particles_img_color + '"';
                    $data_attr += ' data-particles-size="' + wglParallax.backEndVars.particles_img_max_size + '"';
                    $data_attr += ' data-particles-rotate="' + wglParallax.backEndVars.particles_img_rotate + '"';
                    $data_attr += ' data-particles-rotate-animation="' + wglParallax.backEndVars.particles_img_rotate_speed + '"';

                    if(wglParallax.backEndVars.particles_img_line){
                        $data_attr += ' data-particles-line="true"';
                    }else{
                        $data_attr += ' data-particles-line="false"';
                    }

                    if(wglParallax.backEndVars.particles_img_hover_animation === "none"){
                        $data_attr += ' data-particles-hover="false"';
                        $data_attr += ' data-particles-hover-mode="grab"';
                    }else{
                        $data_attr += ' data-particles-hover="true"';
                        $data_attr += ' data-particles-hover-mode="' + wglParallax.backEndVars.particles_img_hover_animation + '"';
                    }

                    $data_attr += ' data-particles-type="image"';

                    var style_array = ''
                    style_array += 'width:' + wglParallax.backEndVars.particles_img_container_width + '%; ';
                    style_array += 'height:' + wglParallax.backEndVars.particles_img_container_height + '%;';

                    $style_attr += ' style="' + style_array + '"';

                    var $string_url = [];
                    $.each(settings, function (index, value) {
                        $string_url.push(value.particles_image.url + '?width=' + value.particles_img_width + '&height=' + value.particles_img_height);
                    });

                    $data_attr += ' data-image="' + $string_url.join()  + '"';

                    node_str = '<div id="extended_' + uniqId + '" data-item-id="' + uniqId + '" class="wgl-particles-img-js particles-js elementor-repeater-item-' + uniqId + '"' + $data_attr + $style_attr + '>';
                    node_str += '</div>';

                    if (!$(self).find('.elementor-repeater-item-' + uniqId).length > 0) {
                        $(self).append(node_str);
                    }

                    var itemContainer = $(self).get(0);
                    $(itemContainer).addClass("wgl-row-animation");

                    wglParallax.backEndVars.__itemID = uniqId;

                    var item = jQuery(self).find('.wgl-particles-img-js');

                    if (item.length !== 0) {
                        if(wglParallax.editorMode){
                            wglParticlesImageCustom();
                        }else{
                            // Dispatch a custom event
                            const event = new CustomEvent("wglParticlesAdded");
                            document.dispatchEvent(event);
                        }
                    }
                },
                hideMobile = function () {
                    if (wglParallax.backEndVars) {
                        if (wglParallax.backEndVars.hide_particles_img_on_mobile) {
                            if (jQuery(window).width() <= wglParallax.backEndVars.hide_particles_img_mobile_resolution) {
                                jQuery('.wgl-particles-img-js[data-item-id="' + wglParallax.backEndVars.__itemID + '"]').css({ 'opacity': '0', 'visibility': 'hidden' });
                            } else {
                                jQuery('.wgl-particles-img-js[data-item-id="' + wglParallax.backEndVars.__itemID + '"]').css({ 'opacity': '1', 'visibility': 'visible' });
                            }
                        }

                    }
                },
                build = function (settings) {
                    var uniqId = Math.random().toString(36).substr(2, 9);
                    appendElement(settings, uniqId);
                };

            /*Init*/
            init();

            jQuery(window).resize(
                function () {
                    hideMobile();
                }
            );
        });
    };

    // Add WGL Dynamic Highlights Animation
    $.fn.WGLSectionDynamicHighlightsInit = function (options) {
        return this.each(function () {

            var self = $(this),
                wglDynamicHighlights = self.wglGlobalVariables('add_dynamic_highlights_animation');

            var initDynamicHighlights = function () {
                setDynamicHighlightsItem();
            },
            setDynamicHighlightsItem = function () {
                var settings;

                wglDynamicHighlights.backEndVars = self.settingsEffectEnabled(wglDynamicHighlights);

                if (!wglDynamicHighlights.backEndVars) {
                    return;
                }

                if (!wglDynamicHighlights.editorMode) {
                    settings = self.buildFront(wglDynamicHighlights, 'items_dynamic_highlights');
                } else {
                    settings = self.buildBackend(wglDynamicHighlights, 'items_dynamic_highlights');
                }

                if (!settings) {
                    return;
                }

                build(settings);
                hideMobile();

            },
            appendElement = function (settings) {
                var node_str,
                    $data_attr = '',
                    $style_attr = '';

                if(settings.dynamic_highlights_color_first){
                    $data_attr += ' data-dynamic-highlights-color-first="' + settings.dynamic_highlights_color_first + '"';
                }
                if(settings.dynamic_highlights_color_second){
                    $data_attr += ' data-dynamic-highlights-color-second="' + settings.dynamic_highlights_color_second + '"';
                }

                node_str = '<div id="extended_' + settings._id + '" data-item-id="' + settings._id + '" class="wgl-dynamic-highlights-js elementor-repeater-item-' + settings._id + '"' + $data_attr + $style_attr + '>';
                node_str += '</div>';


                if (!$(self).find('.elementor-repeater-item-' + settings._id).length > 0) {
                    $(self).append(node_str);
                }

                var itemContainer = $(self).get(0);
                $(itemContainer).addClass("wgl-row-animation");

                wglDynamicHighlights.items.push(settings);

                var item = jQuery(self).find('.wgl-dynamic-highlights-js');
                if (item.length !== 0) {
                    item.each(function () {
                        if (settings._id === jQuery(this).data('itemId')) {
                            //Call Particles WGL Theme
                            if(wglDynamicHighlights.editorMode){
                                jsDynamicHighlights();
                            }
                        }
                    });
                }
            },
            hideMobile = function () {
                if (wglDynamicHighlights.items) {
                    $.each(wglDynamicHighlights.items, function (index, value) {
                        if (value.hide_dynamic_highlights_on_mobile) {
                            if (jQuery(window).width() <= value.hide_dynamic_highlights_mobile_resolution) {
                                jQuery('.wgl-dynamic-highlights-js[data-item-id="' + value._id + '"]').css({ 'opacity': '0', 'visibility': 'hidden' });
                            } else {
                                jQuery('.wgl-dynamic-highlights-js[data-item-id="' + value._id + '"]').css({ 'opacity': '1', 'visibility': 'visible' });
                            }
                        }
                    });
                }
            },
            build = function (settings) {
                $.each(settings, function (index, value) {
                    appendElement(value);
                });
            },
            jsDynamicHighlights = function (settings) {
                var item = jQuery(self).find('.wgl-dynamic-highlights-js');
                if (item.length !== 0) {
                    item.each(function () {
                        var $this = jQuery(this),
                            $window = jQuery(window).height();
                        var color1 = $this.data('dynamic-highlights-color-first'),
                            color2 = $this.data('dynamic-highlights-color-second');

                        if (color1 === color2 || !color1 || !color2) {
                            return;
                        }

                        color1 = hexToRGB(color1);
                        color2 = hexToRGB(color2);

                        window.addEventListener("scroll", scrollThrottler, {passive: true});
                        actualScrollHandler();

                        var scrollTimeout;
                        function scrollThrottler() {
                            if (!scrollTimeout) {
                                scrollTimeout = setTimeout(function () {
                                    scrollTimeout = null;
                                    actualScrollHandler();
                                }, 33); // 30fps
                            }
                        }

                        function actualScrollHandler() {
                            let getheight = $this.height(),
                                offset_top = $this.offset().top,
                                middle_of_item = offset_top - $window + (getheight / 2),
                                scrolly = window.scrollY,
                                scroll = scrolly - middle_of_item;

                            if (middle_of_item <= scrolly && offset_top + (getheight / 2) > scrolly) {

                                const [r, g, b] = [
                                    color1[0] + ((color2[0] - color1[0]) / $window) * scroll,
                                    color1[1] + ((color2[1] - color1[1]) / $window) * scroll,
                                    color1[2] + ((color2[2] - color1[2]) / $window) * scroll,
                                ].map(Math.round);

                                const [a] = [
                                    color1[3] + ((color2[3] - color1[3]) / $window) * scroll
                                ];

                                $this.css("color", `rgba(${r}, ${g}, ${b}, ${a})`);
                            }
                        }
                    });
                }
            },
            hexToRGB = function (h) {
                if (!h) return [255,255,255,0];
                let rgba = [255,255,255,1];

                if (h.length === 4) {
                    // 3 digits
                    rgba[0] = "0x" + h[1] + h[1];
                    rgba[1] = "0x" + h[2] + h[2];
                    rgba[2] = "0x" + h[3] + h[3];

                } else if (h.length === 7) {
                    // 6 digits
                    rgba[0] = "0x" + h[1] + h[2];
                    rgba[1] = "0x" + h[3] + h[4];
                    rgba[2] = "0x" + h[5] + h[6];

                } else if (h.length === 5) {
                    // 4 digits
                    rgba[0] = "0x" + h[1] + h[1];
                    rgba[1] = "0x" + h[2] + h[2];
                    rgba[2] = "0x" + h[3] + h[3];
                    rgba[3] = "0x" + h[4] + h[4];
                    rgba[3] = +(rgba[3] / 255).toFixed(3);

                } else if (h.length === 9) {
                    // 8 digits
                    rgba[0] = "0x" + h[1] + h[2];
                    rgba[1] = "0x" + h[3] + h[4];
                    rgba[2] = "0x" + h[5] + h[6];
                    rgba[3] = "0x" + h[7] + h[8];
                    rgba[3] = +(rgba[3] / 255).toFixed(3);

                }
                rgba[0] = +rgba[0];
                rgba[1] = +rgba[1];
                rgba[2] = +rgba[2];

                return rgba;
            };

            /*Init*/
            initDynamicHighlights();
            jsDynamicHighlights();

            jQuery(window).resize(
                function () {
                    hideMobile();
                }
            );
        });
    };

    // Add WGL Hover Highlights
    $.fn.WGLSectionHoverHighlightsInit = function (options) {
        return this.each(function () {

            var self = $(this),
                wglHoverHighlights = self.wglGlobalVariables('add_hover_highlights_animation');

            var initHoverHighlights = function () {
                setHoverHighlightsItem();
            },
            setHoverHighlightsItem = function () {
                var settings;

                wglHoverHighlights.backEndVars = self.settingsEffectEnabled(wglHoverHighlights);

                if (!wglHoverHighlights.backEndVars) {
                    return;
                }

                if (!wglHoverHighlights.editorMode) {
                    settings = self.buildFront(wglHoverHighlights, 'items_hover_highlights');
                } else {
                    settings = self.buildBackend(wglHoverHighlights, 'items_hover_highlights');
                }

                if (!settings) {
                    return;
                }

                build(settings);
                hideMobile();

            },
            appendElement = function (settings) {
                var node_str,
                    $data_attr = '',
                    $style_attr = '';

                if(settings.hover_highlights_color_first){
                    $data_attr += ' data-hover-highlights-color-first="' + settings.hover_highlights_color_first + '"';
                }
                if(settings.hover_highlights_color_second){
                    $data_attr += ' data-hover-highlights-color-second="' + settings.hover_highlights_color_second + '"';
                }

                node_str = '<div id="extended_' + settings._id + '" data-item-id="' + settings._id + '" class="wgl-hover-highlights-js elementor-repeater-item-' + settings._id + '"' + $data_attr + $style_attr + '>';
                node_str += '</div>';


                if (!$(self).find('.elementor-repeater-item-' + settings._id).length > 0) {
                    $(self).append(node_str);
                }

                wglHoverHighlights.items.push(settings);
            },
            hideMobile = function () {
                if (wglHoverHighlights.items) {
                    $.each(wglHoverHighlights.items, function (index, value) {
                        if (value.hide_hover_highlights_on_mobile) {
                            if (jQuery(window).width() <= value.hide_hover_highlights_mobile_resolution) {
                                jQuery('.wgl-hover-highlights-js[data-item-id="' + value._id + '"]').css({ 'opacity': '0', 'visibility': 'hidden' });
                            } else {
                                jQuery('.wgl-hover-highlights-js[data-item-id="' + value._id + '"]').css({ 'opacity': '1', 'visibility': 'visible' });
                            }
                        }
                    });
                }
            },
            build = function (settings) {
                $.each(settings, function (index, value) {
                    appendElement(value);
                });
            };

            initHoverHighlights();
            jQuery(window).resize(
                function () {
                    hideMobile();
                }
            );
        });
    };

    $.fn.WGLSectionMorphInit = function (options) {
        return this.each(function () {

            var self = $(this),
                wglMorph = self.wglGlobalVariables('add_morph_animation');

            var initMorph = function () {
                setMorphItem();
            },
            setMorphItem = function () {
                var settings;

                var checkEnabledMorph = wglMorph.backEndVars = self.settingsEffectEnabled(wglMorph);

                if (!checkEnabledMorph) {
                    return;
                }

                if (!wglMorph.editorMode) {
                    settings = self.buildFront(wglMorph, 'items_morph');
                } else {
                    settings = self.buildBackend(wglMorph, 'items_morph');
                }

                if (!settings) {
                    return;
                }

                build(settings);
                hideMobile();

            },
            appendElement = function (settings) {
                var $morph_value_1 = 'M161.5,95.7c-0.6-1.5-1.2-2.9-1.9-4.3c-4.1-8.1-4.7-17.5-2.1-26.6c3.8-13.2,1.3-20.5,0.1-25.1' +
                    'c-3.2-12.6-12.8-20.4-15.4-22.4C126.5,5,105.2,5.7,90.9,11.8c-0.2,0.1-0.1,0-0.5,0.2c-12.2,5.3-25,9.3-38,11.1' +
                    'c-6.4,0.9-12.8,2.9-18.9,6.3C10.4,41.9-0.2,68.5,8.9,90.6c6,14.4,18.7,23.8,33.4,26.8c11.1,2.3,20.3,9,24.8,18.7' +
                    'c0.1,0.3,0.3,0.6,0.4,0.9c11.6,24,42.7,32.7,68.6,19C158.9,144,169.9,117.9,161.5,95.7z;' +

                    'M163.7,95.5c0.2-2,0.3-4,0.3-4c0.5-7.2,1.2-15.6,0.3-24.7c-1.1-12-4.4-21.6-6.6-27.1c-2.4-5.8-4-9.7-7.1-13.8' +
                    'C138.2,9.3,113.4,3.8,95.3,8.2c-2.5,0.6-1.8,0.6-6.7,2c-16.3,4.5-23.5,3.9-32.3,6.3c0,0-12.6,3.5-23,12.9' +
                    'c-17.4,16-26.2,47.3-14.7,63.4c8.4,11.8,20.7,5.7,29,19.7c3.5,5.9,5.8,14.5,15.3,24.7c0,0,1.4,1.5,3,3c9.4,8.8,52.1,35.9,76.3,19.3' +
                    'C158.7,148.2,161.3,120.5,163.7,95.5z;' +

                    'M161.5,95.7c-0.3-0.7-0.8-2.2-1.9-4.3c-4.1-8.1-4.7-17.5-2.1-26.6c3.8-13.2,1.3-20.5,0.1-25.1' +
                    'c-3.2-12.6-12.8-20.4-15.4-22.4c-15.7-12.3-37-11.6-51.3-5.5c-0.2,0.1-0.1,0-0.5,0.2c-12.2,5.3-25,9.3-38,11.1' +
                    'C46,24,39.6,26,33.5,29.4C14,40.3-1,72.5,8.9,90.6c11.4,21,51.5,14.4,57.8,36.1c1.1,3.9,0.8,7.3,0.4,9.4c0.1,0.3,0.3,0.6,0.4,0.9' +
                    'c12.2,24.8,41.2,35.8,65.5,26.3C166.2,150.1,167.2,107.6,161.5,95.7z;' +

                    'M161.5,95.7c-0.6-1.5-1.2-2.9-1.9-4.3c-4.1-8.1-4.7-17.5-2.1-26.6c3.8-13.2,1.3-20.5,0.1-25.1' +
                    'c-3.2-12.6-12.8-20.4-15.4-22.4C126.5,5,105.2,5.7,90.9,11.8c-0.2,0.1-0.1,0-0.5,0.2c-12.2,5.3-25,9.3-38,11.1' +
                    'c-6.4,0.9-12.8,2.9-18.9,6.3C10.4,41.9-0.2,68.5,8.9,90.6c6,14.4,18.7,23.8,33.4,26.8c11.1,2.3,20.3,9,24.8,18.7' +
                    'c0.1,0.3,0.3,0.6,0.4,0.9c11.6,24,42.7,32.7,68.6,19C158.9,144,169.9,117.9,161.5,95.7z';

                var $morph_value_2 = 'M78.8,23.2c-3.5,3-8.7,7.6-14.9,13.3c-8.9,8.3-13.5,12.4-17.5,16.6c-5,5.3-10.5,11-15.9,19c-4.9,7.2-11.9,17.7-14.5,32.8' +
                    'c-1.4,8.1-3.6,21.1,3.3,34.2c7.9,14.9,22.7,20.5,30.2,23.3c14.7,5.5,27.3,4.4,36,3.5c17.8-1.8,30.5-8.1,37-11.4' +
                    'c14.4-7.4,22.8-15.7,24.8-17.7c7-7.1,16.6-16.8,15.4-29c-0.3-3.1-1.2-5.6-2-7.3c-3.8-7.8-12-10.7-19.7-21.8c-9.7-13.9,9-32.9,3-47.9' +
                    'c-2.7-6.7-8.7-10.3-10.8-11.8c-9.6-6.7-19.7-6.7-24-6.7C95.2,12.3,84.5,18.3,78.8,23.2z;' +

                    'M78.8,23.2c-3.5,3-8.7,7.6-14.9,13.3c-8.9,8.3-13.5,12.4-17.5,16.6c-8.6,9-12.9,13.5-15.9,19c-7,12.9-6.5,25.7-6.2,32.6' +
                    'c0.3,7.5,0.7,18.7,8,30.7C40,148,50.8,153.8,55,156c6.4,3.3,23.5,12.3,35.7,5.3c9-5.2,5.4-13.5,14.3-20c13.1-9.5,26.7,4.6,42.3-4.7' +
                    'c9.8-5.8,16.7-18.6,15.4-29c-0.5-3.5-1.4-3.4-2-7.3c-1.8-12.1,7.2-17.3,9.3-28c3.1-16.1-11.2-35.8-25.9-41.7c-5-2-6.1-0.8-12.7-3.7' +
                    'c-13.5-5.8-13.6-12.6-22.1-14.8C98.4,9.4,86.4,16.7,78.8,23.2z;' +

                    'M82,8.3c-4.8,3-9.3,11.4-18.1,28.2c-5.2,9.9-5.8,12-10.2,19.5C47.4,66.7,44.3,72,40,76C27.5,87.6,16.6,81.5,8.7,89.7' +
                    'c-10.8,11.1-6.6,38.7,7,55c20,23.9,57.6,20,64,18.7c0.8-0.2,5.1-1.1,11-2c6.6-1,11.4-1.2,12.7-1.3c13.9-1.1,31.1-16,40.7-27.3' +
                    'c3.5-4.2,10.2-12.3,14.3-24.3c1.3-3.8,1-4.2,2.4-8c5.1-14.4,11.6-16.6,14-24c4.9-15.3-12.2-40-30.6-45.7c-5.1-1.5-7.5-0.8-12.7-3.7' +
                    'c-10.8-5.9-10-14.3-18.3-19.7C104.1,1.6,90.5,3,82,8.3z;' +

                    'M78.8,23.2c-3.5,3-8.7,7.6-14.9,13.3c-8.9,8.3-13.5,12.4-17.5,16.6c-5,5.3-10.5,11-15.9,19c-4.9,7.2-11.9,17.7-14.5,32.8' +
                    'c-1.4,8.1-3.6,21.1,3.3,34.2c7.9,14.9,22.7,20.5,30.2,23.3c14.7,5.5,27.3,4.4,36,3.5c17.8-1.8,30.5-8.1,37-11.4' +
                    'c14.4-7.4,22.8-15.7,24.8-17.7c7-7.1,16.6-16.8,15.4-29c-0.3-3.1-1.2-5.6-2-7.3c-3.8-7.8-12-10.7-19.7-21.8c-9.7-13.9,9-32.9,3-47.9' +
                    'c-2.7-6.7-8.7-10.3-10.8-11.8c-9.6-6.7-19.7-6.7-24-6.7C95.2,12.3,84.5,18.3,78.8,23.2z';

                var $morph_value_3 = 'M6.5,39.4C7.9,62.9,6,81.5,3.8,94.8c-2.9,17.7-7.2,30.9,0.4,41.9c5.9,8.5,15.7,11,17.6,11.5' +
                    'c17.9,4.5,26.2-9.4,64-27c25.6-11.9,39.7-13.9,45.3-28c3.1-7.9,1.9-15.3,1.5-17.3c-2.7-12.7-14.2-21.9-28.5-30.4' +
                    'c-20-12-39.7-48.3-72-45.2C29.1,0.5,21.6,1.3,15.3,7C3.2,17.7,6,36.7,6.5,39.4z;' +

                    'M6.5,39.4C7.9,62.9,6,81.5,3.8,94.8c-4.1,24.8-5.6,33.6,0.4,41.9c10.6,14.8,41.6,17.2,56,4.3' +
                    'c11.2-9.9,4.2-21.5,15.8-31c13.8-11.4,29.9,0.5,45-12.3c9-7.6,11.1-18.4,11.7-21.9c2.5-17.1-9-30.9-16.7-40.1' +
                    'C92.4,7.4,57-3,32.2,0.2C25,1.1,19.7,3.1,15.3,7C3.2,17.7,6,36.7,6.5,39.4z;' +

                    'M6.5,39.4C4.9,52.6,3.2,71.6,3.8,94.8c1,39.1,7.2,45.3,10.4,47.7c9.5,7.1,18.1-0.1,46-1.5' +
                    'c38.4-1.9,56.7,10.1,63.5,0.8c6.6-9.2-9.5-22.7-2.8-44c3.6-11.4,9.7-11.7,11.7-21.9c3.5-17.9-11.9-34.9-16.7-40.1' +
                    'C91.8,9,56.5,9.9,47.7,10.2c-11.3,0.3-25.1,0.9-34,11.3C8.4,27.6,7,34.8,6.5,39.4z;' +

                    'M6.5,39.4C7.9,62.9,6,81.5,3.8,94.8c-2.9,17.7-7.2,30.9,0.4,41.9c5.9,8.5,15.7,11,17.6,11.5' +
                    'c17.9,4.5,26.2-9.4,64-27c25.6-11.9,39.7-13.9,45.3-28c3.1-7.9,1.9-15.3,1.5-17.3c-2.7-12.7-14.2-21.9-28.5-30.4' +
                    'c-20-12-39.7-48.3-72-45.2C29.1,0.5,21.6,1.3,15.3,7C3.2,17.7,6,36.7,6.5,39.4z';

                var node_str,
                    $morph_value = '',
                    $morph_speed = settings.morph_animation_speed ? settings.morph_animation_speed : 10;

                wglMorph.items.push(settings);

                var morphStyle = settings.morph_style;
                switch (morphStyle) {
                    case 'style_1':
                    default:
                        $morph_value = $morph_value_1;
                        break;

                    case 'style_2':
                        $morph_value = $morph_value_2;
                        break;

                    case 'style_3':
                        $morph_value = $morph_value_3;
                        break;
                }

                node_str = '<div id="extended_' + settings._id + '" data-item-id="' + settings._id + '" class="wgl-morph-js elementor-repeater-item-' + settings._id + '"' + '>';
                node_str += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 180 180">';
                node_str += '<path d=""><animate repeatCount="indefinite" attributeName="d" dur="' + $morph_speed + '" values="' + $morph_value + '"/></path>';
                node_str += '</svg>';
                node_str += '</div>';

                if (!$(self).find('.elementor-repeater-item-' + settings._id).length > 0) {
                    $(self).append(node_str);
                }
            },
            hideMobile = function () {
                if (wglMorph.items) {
                    $.each(wglMorph.items, function (index, value) {
                        if (value.hide_morph_on_mobile) {
                            if (jQuery(window).width() <= value.hide_morph_mobile_resolution) {
                                jQuery('.wgl-morph-js[data-item-id="' + value._id + '"]').css({ 'opacity': '0', 'visibility': 'hidden' });
                            } else {
                                jQuery('.wgl-morph-js[data-item-id="' + value._id + '"]').css({ 'opacity': '1', 'visibility': 'visible' });
                            }
                        }
                    });
                }
            },
            build = function (settings) {
                $.each(settings, function (index, value) {
                    appendElement(value);
                });
            };

            /*Init*/
            initMorph();

            jQuery(window).resize(
                function () {
                    hideMobile();
                }
            );
        });
    };

    $.fn.WGLSection3DWaveInit = function (options) {
        return this.each(function () {

            var self = $(this),
                settings,
                wglWave = self.wglGlobalVariables('add_wave'),
                init3DWave = function () {
                    setWaveItem();
                },

            setWaveItem = function () {

                wglWave.backEndVars = self.settingsEffectEnabled(wglWave);
                if (!wglWave.backEndVars) {
                    return;
                }

                if (!wglWave.editorMode) {
                    settings = wgl_parallax_settings[0][wglWave.itemId];
                } else {
                    settings = buildBackendWave().backEndVars;
                }

                if (!settings) return;

                build(settings);
                hideWaveOnMobile(settings);
            },

            buildBackendWave = function () {
                if (!window.elementor.elements.models) return;

                return wglWave;
            },

            prependElement = function (settings) {

                if (!settings) return;

                var node_str = '<div id="wgl-elementor-wave-' + wglWave.itemId + '" class="wgl-wave" data-item-id="' + wglWave.itemId + '"></div>';
                $(self).prepend(node_str);
                onDocumentReady(settings);
                animate();
            },
            build = function (settings) {
                prependElement(settings);
            },

            idA, camera, scene, renderer,
            container, particle,
            winHalfX, winHalfY,
            height, width, fieldOfView,
            aspectRatio, nearPlane, farPlane,
            cameraZ, material,
            i = 0,
            count = 0,
            Tau = Math.PI * 2,
            mouseX = 0,
            mouseY = 0,
            amtX = 50,
            amtY = 50,
            sep = 100,
            spriteOpts = {},
            particles = [],

            onDocumentReady = function (settings) {
                container = document.getElementById('wgl-elementor-wave-' + wglWave.itemId);
                height = container.parentElement.clientHeight;
                winHalfY = height / 2;
                width = container.parentElement.clientWidth;
                winHalfX = width / 2;
                fieldOfView = 75;
                aspectRatio = width / height;
                nearPlane = 1;
                farPlane = 10000;
                cameraZ = 750;

                rendererer(onRendererRenderered,settings);
            },
            rendererer = function (complete,settings) {
                var maxX = settings.wave_dots_max_x && settings.wave_dots_max_x['size'] ? settings.wave_dots_max_x['size'] : null,
                    maxY = settings.wave_dots_max_y && settings.wave_dots_max_y['size'] ? settings.wave_dots_max_y['size'] : null,
                    dots_color = !!settings.wave_dots_color ? settings.wave_dots_color : '#000',
                    bg_color = !!settings.wave_bg_color ? settings.wave_bg_color : '#000';

                //lights (no lights!) camera, action!
                camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
                camera.position.z = cameraZ;
                camera.position.x = maxX;
                camera.position.y = maxY;

                scene = new THREE.Scene();

                //material settings
                spriteOpts = {
                    color: dots_color,
                    program: function (ctx) {
                        ctx.beginPath();
                        ctx.arc(0, 0, 0.5, 0, Tau, true);
                        ctx.fill();
                    }
                };

                material = new THREE.SpriteCanvasMaterial(spriteOpts);

                // Stop! particle time!
                for (var ix = 0, lx = amtX; ix < lx; ix++) {

                    for (var iy = 0, ly = amtY; iy < ly; iy++) {
                        particle = particles[i++] = new THREE.Sprite(material);
                        particle.position.x = ix * sep - ((amtX * sep) / 2);
                        particle.position.z = iy * sep - ((amtY * sep) / 2);
                        scene.add(particle);
                    }
                }

                //render the scene
                renderer = new THREE.CanvasRenderer();
                renderer.setClearColor(bg_color, 1);

                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(width, height);

                // append the rendered scene to the container
                container.appendChild(renderer.domElement);

                // Scene!
                if (complete) {
                    complete(settings);
                }
            },
            onRendererRenderered = function (settings) {
                // bind events
                if (settings.wave_mouse_manipulation) {
                    document.addEventListener('mousemove', onDocumentMouseMove);
                    document.addEventListener('touchstart', onDocumentTouchStart);
                    document.addEventListener('touchmove', onDocumentTouchMove);
                }
                window.addEventListener('resize', onWindowResize );
                window.wglWaveSettings = settings;
            },
            onDocumentMouseMove = function (e) {
                mouseX = e.clientX - winHalfX;
                mouseY = e.clientY - winHalfY;
            },
            onDocumentTouchStart = function (e) {
                if (e.touches.length === 1) {
                    e.preventDefault();
                    mouseX = e.touches[0].pageX - winHalfX;
                    mouseY = e.touches[0].pageY - winHalfY;
                }
            },
            onDocumentTouchMove = function (e) {
                if (e.touches.length === 1) {
                    e.preventDefault();
                    mouseX = e.touches[0].pageX - winHalfX;
                    mouseY = e.touches[0].pageY - winHalfY;
                }
            },
            onWindowResize = function (event) {
                settings = event.currentTarget.wglWaveSettings;
                // update variables to new values
                container = document.getElementById('wgl-elementor-wave-' + wglWave.itemId);
                height = container.parentElement.clientHeight;
                winHalfY = height / 2;
                width = container.parentElement.clientWidth;
                winHalfX = width / 2;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                hideWaveOnMobile(settings);
                if (wglWave.editorMode) {
                    update(settings);
                }
            },
            animate = function () {

                idA = window.requestAnimationFrame(animate);
                if (wglWave.editorMode) {
                    cancelAnimationFrame(idA);
                }

                if (!(settings.wave_hide_on_mobile && jQuery(window).width() <= settings.wave_hide_mobile_resolution)) {  // disable on mobile
                    update(settings);
                }
            },
            hideWaveOnMobile = function (settings) {
                if (settings.wave_hide_on_mobile) {
                    if (jQuery(window).width() <= settings.wave_hide_mobile_resolution) {
                        jQuery('.wgl-wave[data-item-id="' + wglWave.itemId + '"]').css({ 'visibility': 'hidden' });
                    } else {
                        jQuery('.wgl-wave[data-item-id="' + wglWave.itemId + '"]').css({ 'visibility': 'visible' });
                    }
                }
            },
            update = function (settings) {
                if (settings.wave_mouse_manipulation) {
                    var maxX = settings.wave_dots_max_X && settings.wave_dots_max_x['size'] ? settings.wave_dots_max_x['size'] : null,
                        miceX = !!maxX ? maxX + mouseX : mouseX,
                        maxY = settings.wave_dots_max_y && settings.wave_dots_max_y['size'] ? settings.wave_dots_max_y['size'] : null,
                        miceY = !!maxY ? maxY + mouseY : mouseY;

                    camera.position.x += (miceX - camera.position.x) * 0.003;
                    camera.position.y += (miceY - camera.position.y) * 0.005;
                }
                camera.lookAt(scene.position);

                i = 0;
                for (var ix = 0, lx = amtX; ix < lx; ix++) {

                    for (var iy = 0, ly = amtY; iy < ly; iy++) {
                        particle = particles[i++];
                        particle.position.y = (Math.sin((ix + count) * 0.3) * 50) + (Math.sin((iy + count) * 0.5) * 50);
                        particle.scale.x = particle.scale.y = (Math.sin((ix + count) * 0.3) + 1) * 4 + (Math.sin((iy + count) * 0.5) + 1) * 4;
                        scene.add(particle);
                    }
                }

                renderer.render(scene, camera);
                count += 0.1;
            }

            /*Init*/
            init3DWave();
        });
    };

    // Add WGL Shape Divider
    $.fn.WGLSectionShapeDividerInit = function (options) {
        return this.each(function () {

            var self = $(this),
                wglShapeDivider = {
                    editorMode: window.elementorFrontend.isEditMode(),
                    itemId: $(this).data('id'),
                    options: false,
                    globalVars: 'add_shape_divider',
                    backEndVars: [],
                    items: [],
                };

            var init = function () {
                setShapeDividerItem();
            },
                setShapeDividerItem = function () {
                    var settings;

                    var checkEnabledParallax = ShapeDividerEnabled();

                    if (!checkEnabledParallax) {
                        return;
                    }

                    if (!wglShapeDivider.editorMode) {
                        settings = buildFrontShapeDivider();
                    } else {
                        settings = buildBackendShapeDivider();
                    }

                    if (!settings) {
                        return;
                    }

                    build(settings);
                },

                ShapeDividerEnabled = function () {
                    var settings = {};

                    if (!wglShapeDivider.editorMode) {
                        settings = wgl_parallax_settings[0][wglShapeDivider.itemId];

                        if (!settings) {
                            return;
                        }

                    } else {
                        if (!window.elementor.elements) {
                            return;
                        }

                        if (!window.elementor.elements.models) {
                            return;
                        }

                        window.elementor.elements.models.forEach(function (value) {
                            if (wglShapeDivider.itemId == value.id) {
                                wglShapeDivider.backEndVars[wglShapeDivider.itemId] = value.attributes.settings.attributes;
                                settings = value.attributes.settings.attributes;
                            }
                        });
                    }

                    return settings;
                },

                buildFrontShapeDivider = function () {
                    var settings = wgl_parallax_settings[0];
                    return settings;
                },

                buildBackendShapeDivider = function () {
                    if (!window.elementor.elements.models) {
                        return;
                    }
                    var arr = [];
                    arr = wglShapeDivider.backEndVars;
                    return arr;
                },
                getSvgURL = function (fileName) {
                    var svgURL = wgl_parallax_settings.svgURL + fileName + '.svg';
                    return svgURL;
                },
                appendElement = function (settings) {
                    var $item = settings[$(self).data('id')];

                    if (!$item) {
                        return;
                    }

                    var node_str = '',
                        svgURL = '';

                    if ($item.wgl_shape_divider_top && $item.wgl_shape_divider_top !== '') {

                        svgURL = getSvgURL($item.wgl_shape_divider_top);

                        node_str = '<div class="wgl-divider wgl-elementor-shape wgl-elementor-shape-top"></div>';
                        $(self).prepend(node_str);

                        jQuery.get(svgURL, function (data) {
                            $(self).find('.wgl-divider.wgl-elementor-shape-top').empty().append(data.childNodes[0]);
                        });
                    }

                    if ($item.wgl_shape_divider_bottom && $item.wgl_shape_divider_bottom !== '') {

                        svgURL = getSvgURL($item.wgl_shape_divider_bottom);

                        node_str = '<div class="wgl-divider wgl-elementor-shape wgl-elementor-shape-bottom"></div>';
                        $(self).prepend(node_str);

                        jQuery.get(svgURL, function (data) {
                            $(self).find('.wgl-divider.wgl-elementor-shape-bottom').empty().append(data.childNodes[0]);
                        });
                    }
                },
                build = function (settings) {
                    appendElement(settings);
                };

            /*Init*/
            init();

        });
    };
    // Add WGL Shape Divider
    $.fn.WGLSectionAnimateScrollInit = function (options) {
        return this.each(function () {

            var self = $(this),
                settings,
                wglAnimScroll = self.wglGlobalVariables('add_extended_animate_scroll');

            var init = function () {
                setAnimScrollItem();
            },

            setAnimScrollItem = function () {
                wglAnimScroll.backEndVars = self.settingsEffectEnabled(wglAnimScroll);
                if (!wglAnimScroll.backEndVars) {
                    return;
                }

                if (!wglAnimScroll.editorMode) {
                    settings = wgl_parallax_settings[0][wglAnimScroll.itemId];
                } else {
                    settings = buildBackendAnimScroll().backEndVars;
                }

                if (!settings) return;
                build(settings);
            },

            buildBackendAnimScroll = function () {
                if (!window.elementor.elements.models) return;

                return wglAnimScroll;
            },

            isElementInViewport = function (el) {
                const rect = el.getBoundingClientRect(),
                    viewportHeight = window.innerHeight;

                return (viewportHeight - rect.top) / rect.height;
            },

            elementOpacity = function (el, opacity) {
                return Math.round( Math.min(1, Math.max( opacity, isElementInViewport(el) ) ) * 10000 ) / 10000;
            },
            elementRotate = function (el, rotate) {
                return rotate - (rotate * ( Math.round( Math.min(1, Math.max( 0, isElementInViewport(el) ) ) * 10000 ) / 10000 ) );
            },

            handleScroll = function (settings) {
                const animatedSection = self.get(0);

                let opacity = settings.extended_animate_scroll_opacity['size'] ?? 1,
                    rotate = settings.extended_animate_scroll_rotate['size'] ?? 0;

                jQuery(animatedSection).css({
                    'opacity': elementOpacity(animatedSection, opacity),
                    '--wgl-anim-scroll-rotate': elementRotate(animatedSection, rotate) + 'deg',
                });
            },

            build = function (settings) {
                handleScroll(settings);
                document.addEventListener('scroll', function(){ handleScroll(settings) }, false);
            };

            init();
        });
    };

    // Add WGL Layered
    (function () {
        window.WGLLayeredInstances = window.WGLLayeredInstances || new Map();
        window.WGLLastInnerWidth = window.WGLLastInnerWidth || window.innerWidth;

        if (!window.WGLLayeredResizeRegistered) {
            let resizeTimer = null;
            let rafScheduled = false;

            function handleResize() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    if (!rafScheduled) {
                        rafScheduled = true;
                        requestAnimationFrame(function () {
                            const newWidth = window.innerWidth;
                            const widthChanged = newWidth !== window.WGLLastInnerWidth;
                            window.WGLLastInnerWidth = newWidth;

                            if (widthChanged) {
                                window.WGLLayeredInstances.forEach(function (inst) {
                                    try {
                                        inst.reinit();
                                    } catch (e) {
                                        console.warn('WGLLayered reinit error', e);
                                    }
                                });
                                if (
                                    typeof ScrollTrigger !== 'undefined' &&
                                    ScrollTrigger.refresh
                                ) {
                                    ScrollTrigger.refresh();
                                }
                            } else {
                                if (
                                    typeof ScrollTrigger !== 'undefined' &&
                                    ScrollTrigger.refresh
                                ) {
                                    ScrollTrigger.refresh();
                                }
                            }
                            rafScheduled = false;
                        });
                    }
                }, 150);
            }

            window.addEventListener('resize', handleResize, { passive: true });
            window.WGLLayeredResizeRegistered = true;
        }

        $.fn.WGLSectionLayeredInit = function (options) {
            return this.each(function () {
                const self = jQuery(this);
                const itemId = self.data('id');
                if (!itemId) return;

                let instance = window.WGLLayeredInstances.get(itemId);
                if (!instance) {
                    instance = {
                        id: itemId,
                        el: self,
                        tween: null,
                        pinST: null,
                        inited: false,

                        kill: function () {
                            try {
                                this.tween?.scrollTrigger?.kill();
                            } catch (e) {}
                            try {
                                this.tween?.kill();
                            } catch (e) {}
                            try {
                                this.pinST?.kill();
                            } catch (e) {}
                            this.tween = null;
                            this.pinST = null;
                            this.inited = false;
                        },

                        init: function () {
                            if (
                                window.elementorFrontend &&
                                window.elementorFrontend.isEditMode &&
                                window.elementorFrontend.isEditMode()
                            ) {
                                this.kill();
                                return;
                            }

                            let settings =
                                typeof wgl_parallax_settings !== 'undefined' &&
                                wgl_parallax_settings[0]
                                    ? wgl_parallax_settings[0][this.id]
                                    : null;
                            const checkEnabledLayered = function (settings) {
                                return !!(
                                    settings &&
                                    settings.hasOwnProperty('enable_layered') &&
                                    '' !== settings.enable_layered
                                );
                            };
                            const hasProperty = checkEnabledLayered(settings);

                            if (
                                typeof gsap !== 'undefined' &&
                                typeof ScrollTrigger !== 'undefined' &&
                                !window.WGLScrollTriggerRegistered &&
                                hasProperty
                            ) {
                                gsap.registerPlugin(ScrollTrigger);
                                if ('ontouchstart' in window) {
                                    ScrollTrigger.normalizeScroll(true);
                                }
                                ScrollTrigger.config({
                                    ignoreMobileResize: 'ontouchstart' in window ? true : false,
                                    autoRefreshEvents: 'visibilitychange,resize',
                                });
                                window.WGLScrollTriggerRegistered = true;
                            }

                            settings =
                                typeof wgl_parallax_settings !== 'undefined' &&
                                wgl_parallax_settings[0]
                                    ? wgl_parallax_settings[0]
                                    : {};
                            settings = settings[this.id] || {};

                            let hideMobile = false;
                            if (
                                hasProperty &&
                                settings['hide_layered_on_mobile'] &&
                                settings['hide_layered_mobile_resolution']
                            ) {
                                if (
                                    jQuery(window).width() <=
                                    parseInt(settings['hide_layered_mobile_resolution'], 10)
                                ) {
                                    hideMobile = true;
                                }
                            }

                            if (!hasProperty || hideMobile) {
                                this.kill();
                                gsap.set(this.el, { clearProps: 'all' });
                                return;
                            }

                            this.kill();

                            let layeredTarget = this.el,
                                layeredStart =
                                    settings['layered_start_position'] === 'custom'
                                        ? settings['layered_custom_start_position']
                                        : settings['layered_start_position'],
                                layeredEnd =
                                    settings['layered_end_position'] === 'custom'
                                        ? settings['layered_custom_end_position']
                                        : settings['layered_end_position'],
                                layeredEndTrigger = settings['layered_end'],
                                animationType = settings['add_layered_animate_scroll'],
                                enabledPinElements = settings['layered_pin_element'];

                            if (settings['custom_layered_class'])
                                layeredTarget = settings['custom_layered_class'];

                            if (enabledPinElements === 'yes') {
                                this.pinST = ScrollTrigger.create({
                                    trigger: layeredTarget,
                                    endTrigger: layeredEndTrigger,
                                    pin: this.el,
                                    pinSpacing: false,
                                    start: layeredStart,
                                    end: layeredEnd,
                                    markers: false,
                                    invalidateOnRefresh: true,
                                });
                            }

                            function buildFilter(settings, prefix) {
                                const defaults = {
                                    blur: 0,
                                    brightness: 100,
                                    contrast: 100,
                                    grayscale: 0,
                                    hue: 0,
                                    invert: 0,
                                    saturate: 100,
                                    sepia: 0,
                                };
                                const values = Object.fromEntries(
                                    Object.keys(defaults).map(function (k) {
                                        return [k, settings[`${prefix}_${k}`]?.size ?? defaults[k]];
                                    })
                                );
                                const isDefault = Object.keys(defaults).every(function (k) {
                                    return values[k] === defaults[k];
                                });
                                const filter = `blur(${values.blur}px) brightness(${values.brightness}%) contrast(${values.contrast}%) grayscale(${values.grayscale}%) hue-rotate(${values.hue}deg) invert(${values.invert}%) saturate(${values.saturate}%) sepia(${values.sepia}%)`;
                                return { isDefault, filter };
                            }

                            const start = buildFilter(settings, 'layered_css_filter_start');
                            const end = buildFilter(settings, 'layered_css_filter_end');

                            let startFilter = {};
                            let endFilter = {};
                            if (!end.isDefault) {
                                endFilter.filter = function () {
                                    return end.filter;
                                };
                                startFilter.filter = function () {
                                    return start.isDefault
                                        ? buildFilter(settings, 'layered_css_filter_start').filter
                                        : start.filter;
                                };
                            } else if (!start.isDefault) {
                                startFilter.filter = function () {
                                    return start.filter;
                                };
                            }

                            const stConfig = {
                                trigger: layeredTarget,
                                start: layeredStart,
                                end: layeredEnd,
                                scrub: true,
                                invalidateOnRefresh: true,
                                force3D: true,
                            };

                            try {
                                if (animationType === 'fade') {
                                    this.tween = gsap.fromTo(
                                        this.el,
                                        {
                                            opacity: function () {
                                                return settings['layered_fade_start_opacity']?.size ?? 0;
                                            },
                                            ...startFilter,
                                        },
                                        {
                                            opacity: function () {
                                                return settings['layered_fade_end_opacity']?.size ?? 1;
                                            },
                                            ease: 'none',
                                            ...endFilter,
                                            scrollTrigger: stConfig,
                                        }
                                    );
                                } else if (animationType === 'move') {
                                    this.tween = gsap.fromTo(
                                        this.el,
                                        {
                                            rotationX: function () {
                                                return settings['layered_move_rotate_x']?.size ?? -45;
                                            },
                                            rotationY: function () {
                                                return settings['layered_move_rotate_y']?.size ?? 0;
                                            },
                                            transformPerspective: function () {
                                                return settings['layered_move_perspective'] ?? 1000;
                                            },
                                            transformOrigin: 'center center',
                                            opacity: function () {
                                                return settings['layered_fade_start_opacity']?.size ?? 0.5;
                                            },
                                            ...startFilter,
                                        },
                                        {
                                            rotationX: 0,
                                            rotationY: 0,
                                            opacity: function () {
                                                return settings['layered_fade_end_opacity']?.size ?? 1;
                                            },
                                            ...endFilter,
                                            ease: 'none',
                                            scrollTrigger: stConfig,
                                        }
                                    );
                                } else if (animationType === 'zoom') {
                                    this.tween = gsap.fromTo(
                                        this.el,
                                        {
                                            scale: function () {
                                                return settings['layered_zoom_start_scale']?.size ?? 1;
                                            },
                                            opacity: function () {
                                                return settings['layered_fade_start_opacity']?.size ?? 1;
                                            },
                                            transformOrigin: 'center center',
                                            ...startFilter,
                                        },
                                        {
                                            scale: function () {
                                                return settings['layered_zoom_end_scale']?.size ?? 0.9;
                                            },
                                            opacity: function () {
                                                return settings['layered_fade_end_opacity']?.size ?? 1;
                                            },
                                            ease: 'none',
                                            ...endFilter,
                                            scrollTrigger: stConfig,
                                        }
                                    );
                                }
                            } catch (e) {
                                console.warn('tween create err', e);
                            }

                            this.el.css('transition', 'none');
                            this.inited = true;
                        },

                        reinit: function () {
                            this.kill();
                            this.init();
                        },
                    };

                    window.WGLLayeredInstances.set(itemId, instance);
                }

                instance.el = self;
                try {
                    instance.init();
                } catch (e) {
                    console.warn('instance.init error', e);
                }
            });
        };
    })();
}(jQuery, window));
