var H5P = H5P || {};
/**
 * Transition contains helper function relevant for transitioning
 */
H5P.Transition = (function ($) {

  /**
   * @class
   * @namespace H5P
   */
  Transition = {};

  /**
   * @private
   */
  Transition.transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'transition':       'transitionend',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  /**
   * @private
   */
  Transition.cache = [];

  /**
   * Get the vendor property name for an event
   *
   * @function H5P.Transition.getVendorPropertyName
   * @static
   * @private
   * @param  {string} prop Generic property name
   * @return {string}      Vendor specific property name
   */
  Transition.getVendorPropertyName = function (prop) {

    if (Transition.cache[prop] !== undefined) {
      return Transition.cache[prop];
    }

    var div = document.createElement('div');

    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) {
      Transition.cache[prop] = prop;
    }
    else {
      var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
      var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

      if (prop in div.style) {
        Transition.cache[prop] = prop;
      }
      else {
        for (var i = 0; i < prefixes.length; ++i) {
          var vendorProp = prefixes[i] + prop_;
          if (vendorProp in div.style) {
            Transition.cache[prop] = vendorProp;
            break;
          }
        }
      }
    }

    return Transition.cache[prop];
  };

  /**
   * Get the name of the transition end event
   *
   * @static
   * @private
   * @return {string}  description
   */
  Transition.getTransitionEndEventName = function () {
    return Transition.transitionEndEventNames[Transition.getVendorPropertyName('transition')] || undefined;
  };

  /**
   * Helper function for listening on transition end events
   *
   * @function H5P.Transition.onTransitionEnd
   * @static
   * @param  {domElement} $element The element which is transitioned
   * @param  {function} callback The callback to be invoked when transition is finished
   * @param  {number} timeout  Timeout in milliseconds. Fallback if transition event is never fired
   */
  Transition.onTransitionEnd = function ($element, callback, timeout) {
    // Fallback on 1 second if transition event is not supported/triggered
    timeout = timeout || 1000;
    Transition.transitionEndEventName = Transition.transitionEndEventName || Transition.getTransitionEndEventName();
    var callbackCalled = false;

    var doCallback = function () {
      if (callbackCalled) {
        return;
      }
      $element.off(Transition.transitionEndEventName, callback);
      callbackCalled = true;
      clearTimeout(timer);
      callback();
    };

    var timer = setTimeout(function () {
      doCallback();
    }, timeout);

    $element.on(Transition.transitionEndEventName, function () {
      doCallback();
    });
  };

  /**
   * Wait for a transition - when finished, invokes next in line
   *
   * @private
   *
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   * @param {number}      index                   The index for current transition
   */
  var runSequence = function (transitions, index) {
    if (index >= transitions.length) {
      return;
    }

    var transition = transitions[index];
    H5P.Transition.onTransitionEnd(transition.$element, function () {
      if (transition.end) {
        transition.end();
      }
      if (transition.break !== true) {
        runSequence(transitions, index+1);
      }
    }, transition.timeout || undefined);
  };

  /**
   * Run a sequence of transitions
   *
   * @function H5P.Transition.sequence
   * @static
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   */
  Transition.sequence = function (transitions) {
    runSequence(transitions, 0);
  };

  return Transition;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a help text dialog
 */
H5P.JoubelHelpTextDialog = (function ($) {

  var numInstances = 0;
  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery}  $container  The container which message dialog will be appended to
   * @param {string}      message     The message
   * @param {string}      closeButtonTitle The title for the close button
   * @return {H5P.jQuery}
   */
  function JoubelHelpTextDialog(header, message, closeButtonTitle) {
    H5P.EventDispatcher.call(this);

    var self = this;

    numInstances++;
    var headerId = 'joubel-help-text-header-' + numInstances;
    var helpTextId = 'joubel-help-text-body-' + numInstances;

    var $helpTextDialogBox = $('<div>', {
      'class': 'joubel-help-text-dialog-box',
      'role': 'dialog',
      'aria-labelledby': headerId,
      'aria-describedby': helpTextId
    });

    $('<div>', {
      'class': 'joubel-help-text-dialog-background'
    }).appendTo($helpTextDialogBox);

    var $helpTextDialogContainer = $('<div>', {
      'class': 'joubel-help-text-dialog-container'
    }).appendTo($helpTextDialogBox);

    $('<div>', {
      'class': 'joubel-help-text-header',
      'id': headerId,
      'role': 'header',
      'html': header
    }).appendTo($helpTextDialogContainer);

    $('<div>', {
      'class': 'joubel-help-text-body',
      'id': helpTextId,
      'html': message,
      'role': 'document',
      'tabindex': 0
    }).appendTo($helpTextDialogContainer);

    var handleClose = function () {
      $helpTextDialogBox.remove();
      self.trigger('closed');
    };

    var $closeButton = $('<div>', {
      'class': 'joubel-help-text-remove',
      'role': 'button',
      'title': closeButtonTitle,
      'tabindex': 1,
      'click': handleClose,
      'keydown': function (event) {
        // 32 - space, 13 - enter
        if ([32, 13].indexOf(event.which) !== -1) {
          event.preventDefault();
          handleClose();
        }
      }
    }).appendTo($helpTextDialogContainer);

    /**
     * Get the DOM element
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return $helpTextDialogBox;
    };

    self.focus = function () {
      $closeButton.focus();
    };
  }

  JoubelHelpTextDialog.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelHelpTextDialog.prototype.constructor = JoubelHelpTextDialog;

  return JoubelHelpTextDialog;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating auto-disappearing dialogs
 */
H5P.JoubelMessageDialog = (function ($) {

  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery} $container The container which message dialog will be appended to
   * @param {string} message The message
   * @return {H5P.jQuery}
   */
  function JoubelMessageDialog ($container, message) {
    var timeout;

    var removeDialog = function () {
      $warning.remove();
      clearTimeout(timeout);
      $container.off('click.messageDialog');
    };

    // Create warning popup:
    var $warning = $('<div/>', {
      'class': 'joubel-message-dialog',
      text: message
    }).appendTo($container);

    // Remove after 3 seconds or if user clicks anywhere in $container:
    timeout = setTimeout(removeDialog, 3000);
    $container.on('click.messageDialog', removeDialog);

    return $warning;
  }

  return JoubelMessageDialog;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a circular progress bar
 */

H5P.JoubelProgressCircle = (function ($) {

  /**
   * Constructor for the Progress Circle
   *
   * @param {Number} number The amount of progress to display
   * @param {string} progressColor Color for the progress meter
   * @param {string} backgroundColor Color behind the progress meter
   */
  function ProgressCircle(number, progressColor, fillColor, backgroundColor) {
    progressColor = progressColor || '#1a73d9';
    fillColor = fillColor || '#f0f0f0';
    backgroundColor = backgroundColor || '#ffffff';
    var progressColorRGB = this.hexToRgb(progressColor);

    //Verify number
    try {
      number = Number(number);
      if (number === '') {
        throw 'is empty';
      }
      if (isNaN(number)) {
        throw 'is not a number';
      }
    } catch (e) {
      number = 'err';
    }

    //Draw circle
    if (number > 100) {
      number = 100;
    }

    // We can not use rgba, since they will stack on top of each other.
    // Instead we create the equivalent of the rgba color
    // and applies this to the activeborder and background color.
    var progressColorString = 'rgb(' + parseInt(progressColorRGB.r, 10) +
      ',' + parseInt(progressColorRGB.g, 10) +
      ',' + parseInt(progressColorRGB.b, 10) + ')';

    // Circle wrapper
    var $wrapper = $('<div/>', {
      'class': "joubel-progress-circle-wrapper"
    });

    //Active border indicates progress
    var $activeBorder = $('<div/>', {
      'class': "joubel-progress-circle-active-border"
    }).appendTo($wrapper);

    //Background circle
    var $backgroundCircle = $('<div/>', {
      'class': "joubel-progress-circle-circle"
    }).appendTo($activeBorder);

    //Progress text/number
    $('<span/>', {
      'text': number + '%',
      'class': "joubel-progress-circle-percentage"
    }).appendTo($backgroundCircle);

    var deg = number * 3.6;
    if (deg <= 180) {
      $activeBorder.css('background-image',
        'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, ' + fillColor + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    } else {
      $activeBorder.css('background-image',
        'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, ' + progressColorString + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    }

    this.$activeBorder = $activeBorder;
    this.$backgroundCircle = $backgroundCircle;
    this.$wrapper = $wrapper;

    this.initResizeFunctionality();

    return $wrapper;
  }

  /**
   * Initializes resize functionality for the progress circle
   */
  ProgressCircle.prototype.initResizeFunctionality = function () {
    var self = this;

    $(window).resize(function () {
      // Queue resize
      setTimeout(function () {
        self.resize();
      });
    });

    // First resize
    setTimeout(function () {
      self.resize();
    }, 0);
  };

  /**
   * Resize function makes progress circle grow or shrink relative to parent container
   */
  ProgressCircle.prototype.resize = function () {
    var $parent = this.$wrapper.parent();

    if ($parent !== undefined && $parent) {

      // Measurements
      var fontSize = parseInt($parent.css('font-size'), 10);

      // Static sizes
      var fontSizeMultiplum = 3.75;
      var progressCircleWidthPx = parseInt((fontSize / 4.5), 10) % 2 === 0 ? parseInt((fontSize / 4.5), 10) + 4 : parseInt((fontSize / 4.5), 10) + 5;
      var progressCircleOffset = progressCircleWidthPx / 2;

      var width = fontSize * fontSizeMultiplum;
      var height = fontSize * fontSizeMultiplum;
      this.$activeBorder.css({
        'width': width,
        'height': height
      });

      this.$backgroundCircle.css({
        'width': width - progressCircleWidthPx,
        'height': height - progressCircleWidthPx,
        'top': progressCircleOffset,
        'left': progressCircleOffset
      });
    }
  };

  /**
   * Hex to RGB conversion
   * @param hex
   * @returns {{r: Number, g: Number, b: Number}}
   */
  ProgressCircle.prototype.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return ProgressCircle;

}(H5P.jQuery));
;
var H5P = H5P || {};

H5P.SimpleRoundedButton = (function ($) {

  /**
   * Creates a new tip
   */
  function SimpleRoundedButton(text) {

    var $simpleRoundedButton = $('<div>', {
      'class': 'joubel-simple-rounded-button',
      'title': text,
      'role': 'button',
      'tabindex': '0'
    }).keydown(function (e) {
      // 32 - space, 13 - enter
      if ([32, 13].indexOf(e.which) !== -1) {
        $(this).click();
        e.preventDefault();
      }
    });

    $('<span>', {
      'class': 'joubel-simple-rounded-button-text',
      'html': text
    }).appendTo($simpleRoundedButton);

    return $simpleRoundedButton;
  }

  return SimpleRoundedButton;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating speech bubbles
 */
H5P.JoubelSpeechBubble = (function ($) {

  var $currentSpeechBubble;
  var $currentContainer;  
  var $tail;
  var $innerTail;
  var removeSpeechBubbleTimeout;
  var currentMaxWidth;

  var DEFAULT_MAX_WIDTH = 400;

  var iDevice = navigator.userAgent.match(/iPod|iPhone|iPad/g) ? true : false;

  /**
   * Creates a new speech bubble
   *
   * @param {H5P.jQuery} $container The speaking object
   * @param {string} text The text to display
   * @param {number} maxWidth The maximum width of the bubble
   * @return {H5P.JoubelSpeechBubble}
   */
  function JoubelSpeechBubble($container, text, maxWidth) {
    maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    currentMaxWidth = maxWidth;
    $currentContainer = $container;

    this.isCurrent = function ($tip) {
      return $tip.is($currentContainer);
    };

    this.remove = function () {
      remove();
    };

    var fadeOutSpeechBubble = function ($speechBubble) {
      if (!$speechBubble) {
        return;
      }

      // Stop removing bubble
      clearTimeout(removeSpeechBubbleTimeout);

      $speechBubble.removeClass('show');
      setTimeout(function () {
        if ($speechBubble) {
          $speechBubble.remove();
          $speechBubble = undefined;
        }
      }, 500);
    };

    if ($currentSpeechBubble !== undefined) {
      remove();
    }

    var $h5pContainer = getH5PContainer($container);

    // Make sure we fade out old speech bubble
    fadeOutSpeechBubble($currentSpeechBubble);

    // Create bubble
    $tail = $('<div class="joubel-speech-bubble-tail"></div>');
    $innerTail = $('<div class="joubel-speech-bubble-inner-tail"></div>');
    var $innerBubble = $(
      '<div class="joubel-speech-bubble-inner">' +
      '<div class="joubel-speech-bubble-text">' + text + '</div>' +
      '</div>'
    ).prepend($innerTail);

    $currentSpeechBubble = $(
      '<div class="joubel-speech-bubble" aria-live="assertive">'
    ).append([$tail, $innerBubble])
      .appendTo($h5pContainer);

    // Show speech bubble with transition
    setTimeout(function () {
      $currentSpeechBubble.addClass('show');
    }, 0);

    position($currentSpeechBubble, $currentContainer, maxWidth, $tail, $innerTail);

    // Handle click to close
    H5P.$body.on('mousedown.speechBubble', handleOutsideClick);

    // Handle window resizing
    H5P.$window.on('resize', '', handleResize);

    // Handle clicks when inside IV which blocks bubbling.
    $container.parents('.h5p-dialog')
      .on('mousedown.speechBubble', handleOutsideClick);

    if (iDevice) {
      H5P.$body.css('cursor', 'pointer');
    }

    return this;
  }

  // Remove speechbubble if it belongs to a dom element that is about to be hidden
  H5P.externalDispatcher.on('domHidden', function (event) {
    if ($currentSpeechBubble !== undefined && event.data.$dom.find($currentContainer).length !== 0) {
      remove();
    }
  });

  /**
   * Returns the closest h5p container for the given DOM element.
   * 
   * @param {object} $container jquery element
   * @return {object} the h5p container (jquery element)
   */
  function getH5PContainer($container) {
    var $h5pContainer = $container.closest('.h5p-frame');

    // Check closest h5p frame first, then check for container in case there is no frame.
    if (!$h5pContainer.length) {
      $h5pContainer = $container.closest('.h5p-container');
    }

    return $h5pContainer;
  }

  /**
   * Event handler that is called when the window is resized.
   */
  function handleResize() {
    position($currentSpeechBubble, $currentContainer, currentMaxWidth, $tail, $innerTail);
  }

  /**
   * Repositions the speech bubble according to the position of the container.
   * 
   * @param {object} $currentSpeechbubble the speech bubble that should be positioned   
   * @param {object} $container the container to which the speech bubble should point 
   * @param {number} maxWidth the maximum width of the speech bubble
   * @param {object} $tail the tail (the triangle that points to the referenced container)
   * @param {object} $innerTail the inner tail (the triangle that points to the referenced container)
   */
  function position($currentSpeechBubble, $container, maxWidth, $tail, $innerTail) {
    var $h5pContainer = getH5PContainer($container);

    // Calculate offset between the button and the h5p frame
    var offset = getOffsetBetween($h5pContainer, $container);

    var direction = (offset.bottom > offset.top ? 'bottom' : 'top');
    var tipWidth = offset.outerWidth * 0.9; // Var needs to be renamed to make sense
    var bubbleWidth = tipWidth > maxWidth ? maxWidth : tipWidth;

    var bubblePosition = getBubblePosition(bubbleWidth, offset);
    var tailPosition = getTailPosition(bubbleWidth, bubblePosition, offset, $container.width());
    // Need to set font-size, since element is appended to body.
    // Using same font-size as parent. In that way it will grow accordingly
    // when resizing
    var fontSize = 16;//parseFloat($parent.css('font-size'));

    // Set width and position of speech bubble
    $currentSpeechBubble.css(bubbleCSS(
      direction,
      bubbleWidth,
      bubblePosition,
      fontSize
    ));

    var preparedTailCSS = tailCSS(direction, tailPosition);
    $tail.css(preparedTailCSS);
    $innerTail.css(preparedTailCSS);
  }

  /**
   * Static function for removing the speechbubble
   */
  var remove = function () {
    H5P.$body.off('mousedown.speechBubble');
    H5P.$window.off('resize', '', handleResize);
    $currentContainer.parents('.h5p-dialog').off('mousedown.speechBubble');
    if (iDevice) {
      H5P.$body.css('cursor', '');
    }
    if ($currentSpeechBubble !== undefined) {
      // Apply transition, then remove speech bubble
      $currentSpeechBubble.removeClass('show');

      // Make sure we remove any old timeout before reassignment
      clearTimeout(removeSpeechBubbleTimeout);
      removeSpeechBubbleTimeout = setTimeout(function () {
        $currentSpeechBubble.remove();
        $currentSpeechBubble = undefined;
      }, 500);
    }
    // Don't return false here. If the user e.g. clicks a button when the bubble is visible,
    // we want the bubble to disapear AND the button to receive the event
  };

  /**
   * Remove the speech bubble and container reference
   */
  function handleOutsideClick(event) {
    if (event.target === $currentContainer[0]) {
      return; // Button clicks are not outside clicks
    }

    remove();
    // There is no current container when a container isn't clicked
    $currentContainer = undefined;
  }

  /**
   * Calculate position for speech bubble
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} offset
   * @return {object} Return position for the speech bubble
   */
  function getBubblePosition(bubbleWidth, offset) {
    var bubblePosition = {};

    var tailOffset = 9;
    var widthOffset = bubbleWidth / 2;

    // Calculate top position
    bubblePosition.top = offset.top + offset.innerHeight;

    // Calculate bottom position
    bubblePosition.bottom = offset.bottom + offset.innerHeight + tailOffset;

    // Calculate left position
    if (offset.left < widthOffset) {
      bubblePosition.left = 3;
    }
    else if ((offset.left + widthOffset) > offset.outerWidth) {
      bubblePosition.left = offset.outerWidth - bubbleWidth - 3;
    }
    else {
      bubblePosition.left = offset.left - widthOffset + (offset.innerWidth / 2);
    }

    return bubblePosition;
  }

  /**
   * Calculate position for speech bubble tail
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} bubblePosition Speech bubble position
   * @param {object} offset
   * @param {number} iconWidth The width of the tip icon
   * @return {object} Return position for the tail
   */
  function getTailPosition(bubbleWidth, bubblePosition, offset, iconWidth) {
    var tailPosition = {};
    // Magic numbers. Tuned by hand so that the tail fits visually within
    // the bounds of the speech bubble.
    var leftBoundary = 9;
    var rightBoundary = bubbleWidth - 20;

    tailPosition.left = offset.left - bubblePosition.left + (iconWidth / 2) - 6;
    if (tailPosition.left < leftBoundary) {
      tailPosition.left = leftBoundary;
    }
    if (tailPosition.left > rightBoundary) {
      tailPosition.left = rightBoundary;
    }

    tailPosition.top = -6;
    tailPosition.bottom = -6;

    return tailPosition;
  }

  /**
   * Return bubble CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {number} width The width of the speech bubble
   * @param {object} position Speech bubble position
   * @param {number} fontSize The size of the bubbles font
   * @return {object} Return CSS
   */
  function bubbleCSS(direction, width, position, fontSize) {
    if (direction === 'top') {
      return {
        width: width + 'px',
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        top: ''
      };
    }
    else {
      return {
        width: width + 'px',
        top: position.top + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Return tail CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {object} position Tail position
   * @return {object} Return CSS
   */
  function tailCSS(direction, position) {
    if (direction === 'top') {
      return {
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        top: ''
      };
    }
    else {
      return {
        top: position.top + 'px',
        left: position.left + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Calculates the offset between an element inside a container and the
   * container. Only works if all the edges of the inner element are inside the
   * outer element.
   * Width/height of the elements is included as a convenience.
   *
   * @param {H5P.jQuery} $outer
   * @param {H5P.jQuery} $inner
   * @return {object} Position offset
   */
  function getOffsetBetween($outer, $inner) {
    var outer = $outer[0].getBoundingClientRect();
    var inner = $inner[0].getBoundingClientRect();

    return {
      top: inner.top - outer.top,
      right: outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
      left: inner.left - outer.left,
      innerWidth: inner.width,
      innerHeight: inner.height,
      outerWidth: outer.width,
      outerHeight: outer.height
    };
  }

  return JoubelSpeechBubble;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelThrobber = (function ($) {

  /**
   * Creates a new tip
   */
  function JoubelThrobber() {

    // h5p-throbber css is described in core
    var $throbber = $('<div/>', {
      'class': 'h5p-throbber'
    });

    return $throbber;
  }

  return JoubelThrobber;
}(H5P.jQuery));
;
H5P.JoubelTip = (function ($) {
  var $conv = $('<div/>');

  /**
   * Creates a new tip element.
   *
   * NOTE that this may look like a class but it doesn't behave like one.
   * It returns a jQuery object.
   *
   * @param {string} tipHtml The text to display in the popup
   * @param {Object} [behaviour] Options
   * @param {string} [behaviour.tipLabel] Set to use a custom label for the tip button (you want this for good A11Y)
   * @param {boolean} [behaviour.helpIcon] Set to 'true' to Add help-icon classname to Tip button (changes the icon)
   * @param {boolean} [behaviour.showSpeechBubble] Set to 'false' to disable functionality (you may this in the editor)
   * @param {boolean} [behaviour.tabcontrol] Set to 'true' if you plan on controlling the tabindex in the parent (tabindex="-1")
   * @return {H5P.jQuery|undefined} Tip button jQuery element or 'undefined' if invalid tip
   */
  function JoubelTip(tipHtml, behaviour) {

    // Keep track of the popup that appears when you click the Tip button
    var speechBubble;

    // Parse tip html to determine text
    var tipText = $conv.html(tipHtml).text().trim();
    if (tipText === '') {
      return; // The tip has no textual content, i.e. it's invalid.
    }

    // Set default behaviour
    behaviour = $.extend({
      tipLabel: tipText,
      helpIcon: false,
      showSpeechBubble: true,
      tabcontrol: false
    }, behaviour);

    // Create Tip button
    var $tipButton = $('<div/>', {
      class: 'joubel-tip-container' + (behaviour.showSpeechBubble ? '' : ' be-quiet'),
      'aria-label': behaviour.tipLabel,
      'aria-expanded': false,
      role: 'button',
      tabindex: (behaviour.tabcontrol ? -1 : 0),
      click: function (event) {
        // Toggle show/hide popup
        toggleSpeechBubble();
        event.preventDefault();
      },
      keydown: function (event) {
        if (event.which === 32 || event.which === 13) { // Space & enter key
          // Toggle show/hide popup
          toggleSpeechBubble();
          event.stopPropagation();
          event.preventDefault();
        }
        else { // Any other key
          // Toggle hide popup
          toggleSpeechBubble(false);
        }
      },
      // Add markup to render icon
      html: '<span class="joubel-icon-tip-normal ' + (behaviour.helpIcon ? ' help-icon': '') + '">' +
              '<span class="h5p-icon-shadow"></span>' +
              '<span class="h5p-icon-speech-bubble"></span>' +
              '<span class="h5p-icon-info"></span>' +
            '</span>'
      // IMPORTANT: All of the markup elements must have 'pointer-events: none;'
    });

    const $tipAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'polite',
      appendTo: $tipButton,
    });

    /**
     * Tip button interaction handler.
     * Toggle show or hide the speech bubble popup when interacting with the
     * Tip button.
     *
     * @private
     * @param {boolean} [force] 'true' shows and 'false' hides.
     */
    var toggleSpeechBubble = function (force) {
      if (speechBubble !== undefined && speechBubble.isCurrent($tipButton)) {
        // Hide current popup
        speechBubble.remove();
        speechBubble = undefined;

        $tipButton.attr('aria-expanded', false);
        $tipAnnouncer.html('');
      }
      else if (force !== false && behaviour.showSpeechBubble) {
        // Create and show new popup
        speechBubble = H5P.JoubelSpeechBubble($tipButton, tipHtml);
        $tipButton.attr('aria-expanded', true);
        $tipAnnouncer.html(tipHtml);
      }
    };

    return $tipButton;
  }

  return JoubelTip;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelSlider = (function ($) {

  /**
   * Creates a new Slider
   *
   * @param {object} [params] Additional parameters
   */
  function JoubelSlider(params) {
    H5P.EventDispatcher.call(this);

    this.$slider = $('<div>', $.extend({
      'class': 'h5p-joubel-ui-slider'
    }, params));

    this.$slides = [];
    this.currentIndex = 0;
    this.numSlides = 0;
  }
  JoubelSlider.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelSlider.prototype.constructor = JoubelSlider;

  JoubelSlider.prototype.addSlide = function ($content) {
    $content.addClass('h5p-joubel-ui-slide').css({
      'left': (this.numSlides*100) + '%'
    });
    this.$slider.append($content);
    this.$slides.push($content);

    this.numSlides++;

    if(this.numSlides === 1) {
      $content.addClass('current');
    }
  };

  JoubelSlider.prototype.attach = function ($container) {
    $container.append(this.$slider);
  };

  JoubelSlider.prototype.move = function (index) {
    var self = this;

    if(index === 0) {
      self.trigger('first-slide');
    }
    if(index+1 === self.numSlides) {
      self.trigger('last-slide');
    }
    self.trigger('move');

    var $previousSlide = self.$slides[this.currentIndex];
    H5P.Transition.onTransitionEnd(this.$slider, function () {
      $previousSlide.removeClass('current');
      self.trigger('moved');
    });
    this.$slides[index].addClass('current');

    var translateX = 'translateX(' + (-index*100) + '%)';
    this.$slider.css({
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      'transform': translateX
    });

    this.currentIndex = index;
  };

  JoubelSlider.prototype.remove = function () {
    this.$slider.remove();
  };

  JoubelSlider.prototype.next = function () {
    if(this.currentIndex+1 >= this.numSlides) {
      return;
    }

    this.move(this.currentIndex+1);
  };

  JoubelSlider.prototype.previous = function () {
    this.move(this.currentIndex-1);
  };

  JoubelSlider.prototype.first = function () {
    this.move(0);
  };

  JoubelSlider.prototype.last = function () {
    this.move(this.numSlides-1);
  };

  return JoubelSlider;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * @module
 */
H5P.JoubelScoreBar = (function ($) {

  /* Need to use an id for the star SVG since that is the only way to reference
     SVG filters  */
  var idCounter = 0;

  /**
   * Creates a score bar
   * @class H5P.JoubelScoreBar
   * @param {number} maxScore  Maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @param {string} [helpText] Score explanation
   * @param {string} [scoreExplanationButtonLabel] Label for score explanation button
   */
  function JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel) {
    var self = this;

    self.maxScore = maxScore;
    self.score = 0;
    idCounter++;

    /**
     * @const {string}
     */
    self.STAR_MARKUP = '<svg tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.77 53.87" aria-hidden="true" focusable="false">' +
        '<title>star</title>' +
        '<filter tabindex="-1" id="h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + '" x0="-50%" y0="-50%" width="200%" height="200%">' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"></feGaussianBlur>' +
          '<feOffset dy="2" dx="4"></feOffset>' +
          '<feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="SourceGraphic" operator="over" result="firstfilter"></feComposite>' +
          '<feGaussianBlur in="firstfilter" stdDeviation="3" result="blur2"></feGaussianBlur>' +
          '<feOffset dy="-2" dx="-4"></feOffset>' +
          '<feComposite in2="firstfilter" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="firstfilter" operator="over"></feComposite>' +
        '</filter>' +
        '<path tabindex="-1" class="h5p-joubelui-score-bar-star-shadow" d="M35.08,43.41V9.16H20.91v0L9.51,10.85,9,10.93C2.8,12.18,0,17,0,21.25a11.22,11.22,0,0,0,3,7.48l8.73,8.53-1.07,6.16Z"/>' +
        '<g tabindex="-1">' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-border" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-fill" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" filter="url(#h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + ')" class="h5p-joubelui-score-bar-star-fill-full-score" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
        '</g>' +
      '</svg>';

    /**
     * @function appendTo
     * @memberOf H5P.JoubelScoreBar#
     * @param {H5P.jQuery}  $wrapper  Dom container
     */
    self.appendTo = function ($wrapper) {
      self.$scoreBar.appendTo($wrapper);
    };

    /**
     * Create the text representation of the scorebar .
     *
     * @private
     * @return {string}
     */
    var createLabel = function (score) {
      if (!label) {
        return '';
      }

      return label.replace(':num', score).replace(':total', self.maxScore);
    };

    /**
     * Creates the html for this widget
     *
     * @method createHtml
     * @private
     */
    var createHtml = function () {
      // Container div
      self.$scoreBar = $('<div>', {
        'class': 'h5p-joubelui-score-bar',
      });

      var $visuals = $('<div>', {
        'class': 'h5p-joubelui-score-bar-visuals',
        appendTo: self.$scoreBar
      });

      // The progress bar wrapper
      self.$progressWrapper = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress-wrapper',
        appendTo: $visuals
      });

      self.$progress = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress',
        'html': createLabel(self.score),
        appendTo: self.$progressWrapper
      });

      // The star
      $('<div>', {
        'class': 'h5p-joubelui-score-bar-star',
        html: self.STAR_MARKUP
      }).appendTo($visuals);

      // The score container
      var $numerics = $('<div>', {
        'class': 'h5p-joubelui-score-numeric',
        appendTo: self.$scoreBar,
        'aria-hidden': true
      });

      // The current score
      self.$scoreCounter = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-number-counter',
        text: 0,
        appendTo: $numerics
      });

      // The separator
      $('<span>', {
        'class': 'h5p-joubelui-score-number-separator',
        text: '/',
        appendTo: $numerics
      });

      // Max score
      self.$maxScore = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-max',
        text: self.maxScore,
        appendTo: $numerics
      });

      if (helpText) {
        H5P.JoubelUI.createTip(helpText, {
          tipLabel: scoreExplanationButtonLabel ? scoreExplanationButtonLabel : helpText,
          helpIcon: true
        }).appendTo(self.$scoreBar);
        self.$scoreBar.addClass('h5p-score-bar-has-help');
      }
    };

    /**
     * Set the current score
     * @method setScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number} score
     */
    self.setScore = function (score) {
      // Do nothing if score hasn't changed
      if (score === self.score) {
        return;
      }
      self.score = score > self.maxScore ? self.maxScore : score;
      self.updateVisuals();
    };

    /**
     * Increment score
     * @method incrementScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number=}        incrementBy Optional parameter, defaults to 1
     */
    self.incrementScore = function (incrementBy) {
      self.setScore(self.score + (incrementBy || 1));
    };

    /**
     * Set the max score
     * @method setMaxScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number}    maxScore The max score
     */
    self.setMaxScore = function (maxScore) {
      self.maxScore = maxScore;
    };

    /**
     * Updates the progressbar visuals
     * @memberOf H5P.JoubelScoreBar#
     * @method updateVisuals
     */
    self.updateVisuals = function () {
      self.$progress.html(createLabel(self.score));
      self.$scoreCounter.text(self.score);
      self.$maxScore.text(self.maxScore);

      setTimeout(function () {
        // Start the progressbar animation
        self.$progress.css({
          width: ((self.score / self.maxScore) * 100) + '%'
        });

        H5P.Transition.onTransitionEnd(self.$progress, function () {
          // If fullscore fill the star and start the animation
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-full-score', self.score === self.maxScore);
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-animation-active', self.score === self.maxScore);

          // Only allow the star animation to run once
          self.$scoreBar.one("animationend", function() {
            self.$scoreBar.removeClass("h5p-joubelui-score-bar-animation-active");
          });
        }, 600);
      }, 300);
    };

    /**
     * Removes all classes
     * @method reset
     */
    self.reset = function () {
      self.$scoreBar.removeClass('h5p-joubelui-score-bar-full-score');
    };

    createHtml();
  }

  return JoubelScoreBar;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelProgressbar = (function ($) {

  /**
   * Joubel progressbar class
   * @method JoubelProgressbar
   * @constructor
   * @param  {number}          steps Number of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   */
  function JoubelProgressbar(steps, options) {
    H5P.EventDispatcher.call(this);
    var self = this;
    this.options = $.extend({
      progressText: 'Slide :num of :total'
    }, options);
    this.currentStep = 0;
    this.steps = steps;

    this.$progressbar = $('<div>', {
      'class': 'h5p-joubelui-progressbar'
    });
    this.$background = $('<div>', {
      'class': 'h5p-joubelui-progressbar-background'
    }).appendTo(this.$progressbar);
  }

  JoubelProgressbar.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelProgressbar.prototype.constructor = JoubelProgressbar;

  JoubelProgressbar.prototype.updateAria = function () {
    var self = this;
    if (this.options.disableAria) {
      return;
    }

    if (!this.$currentStatus) {
      this.$currentStatus = $('<div>', {
        'class': 'h5p-joubelui-progressbar-slide-status-text',
        'aria-live': 'assertive'
      }).appendTo(this.$progressbar);
    }
    var interpolatedProgressText = self.options.progressText
      .replace(':num', self.currentStep)
      .replace(':total', self.steps);
    this.$currentStatus.html(interpolatedProgressText);
  };

  /**
   * Appends to a container
   * @method appendTo
   * @param  {H5P.jquery} $container
   */
  JoubelProgressbar.prototype.appendTo = function ($container) {
    this.$progressbar.appendTo($container);
  };

  /**
   * Update progress
   * @method setProgress
   * @param  {number}    step
   */
  JoubelProgressbar.prototype.setProgress = function (step) {
    // Check for valid value:
    if (step > this.steps || step < 0) {
      return;
    }
    this.currentStep = step;
    this.$background.css({
      width: ((this.currentStep/this.steps)*100) + '%'
    });

    this.updateAria();
  };

  /**
   * Increment progress with 1
   * @method next
   */
  JoubelProgressbar.prototype.next = function () {
    this.setProgress(this.currentStep+1);
  };

  /**
   * Reset progressbar
   * @method reset
   */
  JoubelProgressbar.prototype.reset = function () {
    this.setProgress(0);
  };

  /**
   * Check if last step is reached
   * @method isLastStep
   * @return {Boolean}
   */
  JoubelProgressbar.prototype.isLastStep = function () {
    return this.steps === this.currentStep;
  };

  return JoubelProgressbar;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * H5P Joubel UI library.
 *
 * This is a utility library, which does not implement attach. I.e, it has to bee actively used by
 * other libraries
 * @module
 */
H5P.JoubelUI = (function ($) {

  /**
   * The internal object to return
   * @class H5P.JoubelUI
   * @static
   */
  function JoubelUI() {}

  /* Public static functions */

  /**
   * Create a tip icon
   * @method H5P.JoubelUI.createTip
   * @param  {string}  text   The textual tip
   * @param  {Object}  params Parameters
   * @return {H5P.JoubelTip}
   */
  JoubelUI.createTip = function (text, params) {
    return new H5P.JoubelTip(text, params);
  };

  /**
   * Create message dialog
   * @method H5P.JoubelUI.createMessageDialog
   * @param  {H5P.jQuery}               $container The dom container
   * @param  {string}                   message    The message
   * @return {H5P.JoubelMessageDialog}
   */
  JoubelUI.createMessageDialog = function ($container, message) {
    return new H5P.JoubelMessageDialog($container, message);
  };

  /**
   * Create help text dialog
   * @method H5P.JoubelUI.createHelpTextDialog
   * @param  {string}             header  The textual header
   * @param  {string}             message The textual message
   * @param  {string}             closeButtonTitle The title for the close button
   * @return {H5P.JoubelHelpTextDialog}
   */
  JoubelUI.createHelpTextDialog = function (header, message, closeButtonTitle) {
    return new H5P.JoubelHelpTextDialog(header, message, closeButtonTitle);
  };

  /**
   * Create progress circle
   * @method H5P.JoubelUI.createProgressCircle
   * @param  {number}             number          The progress (0 to 100)
   * @param  {string}             progressColor   The progress color in hex value
   * @param  {string}             fillColor       The fill color in hex value
   * @param  {string}             backgroundColor The background color in hex value
   * @return {H5P.JoubelProgressCircle}
   */
  JoubelUI.createProgressCircle = function (number, progressColor, fillColor, backgroundColor) {
    return new H5P.JoubelProgressCircle(number, progressColor, fillColor, backgroundColor);
  };

  /**
   * Create throbber for loading
   * @method H5P.JoubelUI.createThrobber
   * @return {H5P.JoubelThrobber}
   */
  JoubelUI.createThrobber = function () {
    return new H5P.JoubelThrobber();
  };

  /**
   * Create simple rounded button
   * @method H5P.JoubelUI.createSimpleRoundedButton
   * @param  {string}                  text The button label
   * @return {H5P.SimpleRoundedButton}
   */
  JoubelUI.createSimpleRoundedButton = function (text) {
    return new H5P.SimpleRoundedButton(text);
  };

  /**
   * Create Slider
   * @method H5P.JoubelUI.createSlider
   * @param  {Object} [params] Parameters
   * @return {H5P.JoubelSlider}
   */
  JoubelUI.createSlider = function (params) {
    return new H5P.JoubelSlider(params);
  };

  /**
   * Create Score Bar
   * @method H5P.JoubelUI.createScoreBar
   * @param  {number=}       maxScore The maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @return {H5P.JoubelScoreBar}
   */
  JoubelUI.createScoreBar = function (maxScore, label, helpText, scoreExplanationButtonLabel) {
    return new H5P.JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel);
  };

  /**
   * Create Progressbar
   * @method H5P.JoubelUI.createProgressbar
   * @param  {number=}       numSteps The total numer of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   * @return {H5P.JoubelProgressbar}
   */
  JoubelUI.createProgressbar = function (numSteps, options) {
    return new H5P.JoubelProgressbar(numSteps, options);
  };

  /**
   * Create standard Joubel button
   *
   * @method H5P.JoubelUI.createButton
   * @param {object} params
   *  May hold any properties allowed by jQuery. If href is set, an A tag
   *  is used, if not a button tag is used.
   * @return {H5P.jQuery} The jquery element created
   */
  JoubelUI.createButton = function(params) {
    var type = 'button';
    if (params.href) {
      type = 'a';
    }
    else {
      params.type = 'button';
    }
    if (params.class) {
      params.class += ' h5p-joubelui-button';
    }
    else {
      params.class = 'h5p-joubelui-button';
    }
    return $('<' + type + '/>', params);
  };

  /**
   * Fix for iframe scoll bug in IOS. When focusing an element that doesn't have
   * focus support by default the iframe will scroll the parent frame so that
   * the focused element is out of view. This varies dependening on the elements
   * of the parent frame.
   */
  if (H5P.isFramed && !H5P.hasiOSiframeScrollFix &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    H5P.hasiOSiframeScrollFix = true;

    // Keep track of original focus function
    var focus = HTMLElement.prototype.focus;

    // Override the original focus
    HTMLElement.prototype.focus = function () {
      // Only focus the element if it supports it natively
      if ( (this instanceof HTMLAnchorElement ||
            this instanceof HTMLInputElement ||
            this instanceof HTMLSelectElement ||
            this instanceof HTMLTextAreaElement ||
            this instanceof HTMLButtonElement ||
            this instanceof HTMLIFrameElement ||
            this instanceof HTMLAreaElement) && // HTMLAreaElement isn't supported by Safari yet.
          !this.getAttribute('role')) { // Focus breaks if a different role has been set
          // In theory this.isContentEditable should be able to recieve focus,
          // but it didn't work when tested.

        // Trigger the original focus with the proper context
        focus.call(this);
      }
    };
  }

  return JoubelUI;
})(H5P.jQuery);
;
if (!Math.sign) {
  Math.sign = function(x) {
    // If x is NaN, the result is NaN.
    // If x is -0, the result is -0.
    // If x is +0, the result is +0.
    // If x is negative and not -0, the result is -1.
    // If x is positive and not +0, the result is +1.
    return ((x > 0) - (x < 0)) || +x;
    // A more aesthetic pseudo-representation:
    //
    // ( (x > 0) ? 1 : 0 )  // if x is positive, then positive one
    //          +           // else (because you can't be both - and +)
    // ( (x < 0) ? -1 : 0 ) // if x is negative, then negative one
    //         ||           // if x is 0, -0, or NaN, or not a number,
    //         +x           // then the result will be x, (or) if x is
    //                      // not a number, then x converts to number
  };
}
(function(e){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=e()}else if(typeof define==="function"&&define.amd){define([],e)}else{var t;if(typeof window!=="undefined"){t=window}else if(typeof global!=="undefined"){t=global}else if(typeof self!=="undefined"){t=self}else{t=this}t.algebra=e()}})(function(){var e,t,r;return function n(e,t,r){function i(o,a){if(!t[o]){if(!e[o]){var u=typeof require=="function"&&require;if(!a&&u)return u(o,!0);if(s)return s(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=t[o]={exports:{}};e[o][0].call(l.exports,function(t){var r=e[o][1][t];return i(r?r:t)},l,l.exports,n,e,t,r)}return t[o].exports}var s=typeof require=="function"&&require;for(var o=0;o<r.length;o++)i(r[o]);return i}({1:[function(e,t,r){var n=e("./src/fractions");var i=e("./src/expressions").Expression;var s=e("./src/equations");var o=e("./src/parser");var a=function(e){var t=new o;var r=t.parse(e);return r};var u=function(e){if(e instanceof n||e instanceof i||e instanceof s){return e.toTex()}else if(e instanceof Array){return e.map(function(e){if(e instanceof n){return e.toTex()}else{return e.toString()}}).join()}else{return e.toString()}};t.exports={Fraction:n,Expression:i,Equation:s,parse:a,toTex:u}},{"./src/equations":2,"./src/expressions":3,"./src/fractions":4,"./src/parser":7}],2:[function(e,t,r){var n=e("./expressions").Expression;var i=e("./expressions").Variable;var s=e("./expressions").Term;var o=e("./fractions");var a=e("./helper").isInt;var u=function(e,t){if(e instanceof n){this.lhs=e;if(t instanceof n){this.rhs=t}else if(t instanceof o||a(t)){this.rhs=new n(t)}else{throw new TypeError("Invalid Argument ("+t.toString()+"): Right-hand side must be of type Expression, Fraction or Integer.")}}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Left-hand side must be of type Expression.")}};u.prototype.solveFor=function(e){if(!this.lhs._hasVariable(e)&&!this.rhs._hasVariable(e)){throw new TypeError("Invalid Argument ("+e.toString()+"): Variable does not exist in the equation.")}if(this._isLinear()||this._variableCanBeIsolated(e)){var t=new s(new i(e));var r=new n;var a=new n;for(var u=0;u<this.rhs.terms.length;u++){var f=this.rhs.terms[u];if(f.canBeCombinedWith(t)){r=r.subtract(f)}else{a=a.add(f)}}for(var u=0;u<this.lhs.terms.length;u++){var f=this.lhs.terms[u];if(f.canBeCombinedWith(t)){r=r.add(f)}else{a=a.subtract(f)}}a=a.subtract(this.lhs.constant());a=a.add(this.rhs.constant());if(r.terms.length===0){if(r.constant().equalTo(a.constant())){return new o(1,1)}else{throw new EvalError("No Solution")}}a=a.divide(r.terms[0].coefficient());if(a.terms.length===0){return a.constant().reduce()}a._sort();return a}else{var r=this.lhs.copy();r=r.subtract(this.rhs);if(r.terms.length===0){if(r.constant().valueOf()===0){return[new o(1,1)]}else{throw new EvalError("No Solution")}}else if(this._isQuadratic(e)){var l=r._quadraticCoefficients();var c=l.a;var p=l.b;var h=l.c;var v=p.pow(2).subtract(c.multiply(h).multiply(4));if(v.valueOf()>=0){if(v.valueOf()===0){return[p.multiply(-1).divide(c.multiply(2)).reduce()]}else{var m;if(v._squareRootIsRational()){m=v.pow(.5);var d=p.multiply(-1).subtract(m).divide(c.multiply(2));var y=p.multiply(-1).add(m).divide(c.multiply(2));return[d.reduce(),y.reduce()]}else{m=Math.sqrt(v.valueOf());c=c.valueOf();p=p.valueOf();var d=(-p-m)/(2*c);var y=(-p+m)/(2*c);return[d,y]}}}else{return[]}}else if(this._isCubic(e)){var l=r._cubicCoefficients();var c=l.a;var p=l.b;var h=l.c;var g=l.d;var b=c.multiply(p).multiply(h).multiply(g).multiply(18);b=b.subtract(p.pow(3).multiply(g).multiply(4));b=b.add(p.pow(2).multiply(h.pow(2)));b=b.subtract(c.multiply(h.pow(3)).multiply(4));b=b.subtract(c.pow(2).multiply(g.pow(2)).multiply(27));var w=p.pow(2).subtract(c.multiply(h).multiply(3));if(b.valueOf()===0){if(w.valueOf()===0){var d=p.multiply(-1).divide(c.multiply(3));return[d.reduce()]}else{var d=c.multiply(p).multiply(h).multiply(4);d=d.subtract(c.pow(2).multiply(g).multiply(9));d=d.subtract(p.pow(3));d=d.divide(c.multiply(w));var y=c.multiply(g).multiply(9).subtract(p.multiply(h)).divide(w.multiply(2));return[d.reduce(),y.reduce()]}}else{var _=(3*(h/c)-Math.pow(p,2)/Math.pow(c,2))/3;var T=2*Math.pow(p,3)/Math.pow(c,3);T=T-9*p*h/Math.pow(c,2);T=T+27*g/c;T=T/27;var E=Math.pow(T,2)/4+Math.pow(_,3)/27;if(E>0){var x=-(T/2)+Math.sqrt(E);var S=Math.cbrt(x);var I=-(T/2)-Math.sqrt(E);var M=Math.cbrt(I);var d=S+M-p/(3*c);if(d<0){var R=Math.floor(d);if(d-R<1e-15)d=R}else if(d>0){var R=Math.ceil(d);if(R-d<1e-15)d=R}return[d]}else{var u=Math.sqrt(Math.pow(T,2)/4-E);var A=Math.cbrt(u);var O=Math.acos(-(T/(2*u)));var D=-A;var k=Math.cos(O/3);var P=Math.sqrt(3)*Math.sin(O/3);var V=-(p/(3*c));var d=2*A*Math.cos(O/3)-p/(3*c);var y=D*(k+P)+V;var C=D*(k-P)+V;if(d<0){var R=Math.floor(d);if(d-R<1e-15)d=R}else if(d>0){var R=Math.ceil(d);if(R-d<1e-15)d=R}if(y<0){var F=Math.floor(y);if(y-F<1e-15)y=F}else if(y>0){var F=Math.ceil(y);if(F-y<1e-15)y=F}if(d<0){var q=Math.floor(C);if(C-q<1e-15)C=q}else if(C>0){var q=Math.ceil(C);if(q-C<1e-15)C=q}var N=[d,y,C];N.sort(function(e,t){return e-t});return[N[0],N[1],N[2]]}}}}};u.prototype.eval=function(e){return new u(this.lhs.eval(e),this.rhs.eval(e))};u.prototype.toString=function(){return this.lhs.toString()+" = "+this.rhs.toString()};u.prototype.toTex=function(){return this.lhs.toTex()+" = "+this.rhs.toTex()};u.prototype._maxDegree=function(){var e=this.lhs._maxDegree();var t=this.rhs._maxDegree();return Math.max(e,t)};u.prototype._maxDegreeOfVariable=function(e){return Math.max(this.lhs._maxDegreeOfVariable(e),this.rhs._maxDegreeOfVariable(e))};u.prototype._variableCanBeIsolated=function(e){return this._maxDegreeOfVariable(e)===1&&this._noCrossProductsWithVariable(e)};u.prototype._noCrossProductsWithVariable=function(e){return this.lhs._noCrossProductsWithVariable(e)&&this.rhs._noCrossProductsWithVariable(e)};u.prototype._noCrossProducts=function(){return this.lhs._noCrossProducts()&&this.rhs._noCrossProducts()};u.prototype._onlyHasVariable=function(e){return this.lhs._onlyHasVariable(e)&&this.rhs._onlyHasVariable(e)};u.prototype._isLinear=function(){return this._maxDegree()===1&&this._noCrossProducts()};u.prototype._isQuadratic=function(e){return this._maxDegree()===2&&this._onlyHasVariable(e)};u.prototype._isCubic=function(e){return this._maxDegree()===3&&this._onlyHasVariable(e)};t.exports=u},{"./expressions":3,"./fractions":4,"./helper":5}],3:[function(e,t,r){var n=e("./fractions");var i=e("./helper").isInt;var s=e("./helper").GREEK_LETTERS;var o=function(e){this.constants=[];if(typeof e==="string"){var t=new a(e);var r=new Term(t);this.terms=[r]}else if(i(e)){this.constants=[new n(e,1)];this.terms=[]}else if(e instanceof n){this.constants=[e];this.terms=[]}else if(e instanceof Term){this.terms=[e]}else if(typeof e==="undefined"){this.terms=[]}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Argument must be of type String, Integer, Fraction or Term.")}};o.prototype.constant=function(){return this.constants.reduce(function(e,t){return e.add(t)},new n(0,1))};o.prototype.simplify=function(){var e=this.copy();e.terms=e.terms.map(function(e){return e.simplify()});e._sort();e._combineLikeTerms();e._moveTermsWithDegreeZeroToConstants();e._removeTermsWithCoefficientZero();e.constants=e.constant().valueOf()===0?[]:[e.constant()];return e};o.prototype.copy=function(){var e=new o;e.constants=this.constants.map(function(e){return e.copy()});e.terms=this.terms.map(function(e){return e.copy()});return e};o.prototype.add=function(e,t){var r=this.copy();if(typeof e==="string"||e instanceof Term||i(e)||e instanceof n){var s=new o(e);return r.add(s,t)}else if(e instanceof o){var a=e.copy().terms;r.terms=r.terms.concat(a);r.constants=r.constants.concat(e.constants);r._sort()}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Summand must be of type String, Expression, Term, Fraction or Integer.")}return t||t===undefined?r.simplify():r};o.prototype.subtract=function(e,t){var r=e instanceof o?e.multiply(-1):new o(e).multiply(-1);return this.add(r,t)};o.prototype.multiply=function(e,t){var r=this.copy();if(typeof e==="string"||e instanceof Term||i(e)||e instanceof n){var s=new o(e);return r.multiply(s,t)}else if(e instanceof o){var a=e.copy();var u=[];for(var f=0;f<r.terms.length;f++){var l=r.terms[f];for(var c=0;c<a.terms.length;c++){var p=a.terms[c];u.push(l.multiply(p,t))}for(var c=0;c<a.constants.length;c++){u.push(l.multiply(a.constants[c],t))}}for(var f=0;f<a.terms.length;f++){var p=a.terms[f];for(var c=0;c<r.constants.length;c++){u.push(p.multiply(r.constants[c],t))}}var h=[];for(var f=0;f<r.constants.length;f++){var v=r.constants[f];for(var c=0;c<a.constants.length;c++){var m=a.constants[c];var d=new Term;d=d.multiply(m,false);d=d.multiply(v,false);u.push(d)}}r.constants=h;r.terms=u;r._sort()}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Multiplicand must be of type String, Expression, Term, Fraction or Integer.")}return t||t===undefined?r.simplify():r};o.prototype.divide=function(e,t){if(e instanceof n||i(e)){if(e.valueOf()===0){throw new EvalError("Divide By Zero")}var r=this.copy();for(var s=0;s<r.terms.length;s++){var o=r.terms[s];for(var a=0;a<o.coefficients.length;a++){o.coefficients[a]=o.coefficients[a].divide(e,t)}}r.constants=r.constants.map(function(r){return r.divide(e,t)});return r}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Divisor must be of type Fraction or Integer.")}};o.prototype.pow=function(e,t){if(i(e)){var r=this.copy();if(e===0){return(new o).add(1)}else{for(var n=1;n<e;n++){r=r.multiply(this,t)}r._sort()}return t||t===undefined?r.simplify():r}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Exponent must be of type Integer.")}};o.prototype.eval=function(e,t){var r=new o;r.constants=t?[this.constant()]:this.constants.slice();r=this.terms.reduce(function(r,n){return r.add(n.eval(e,t),t)},r);return r};o.prototype.summation=function(e,t,r,n){var i=this.copy();var s=new o;for(var a=t;a<r+1;a++){var u={};u[e]=a;s=s.add(i.eval(u,n),n)}return s};o.prototype.toString=function(){var e="";for(var t=0;t<this.terms.length;t++){var r=this.terms[t];e+=(r.coefficients[0].valueOf()<0?" - ":" + ")+r.toString()}for(var t=0;t<this.constants.length;t++){var n=this.constants[t];e+=(n.valueOf()<0?" - ":" + ")+n.abs().toString()}if(e.substring(0,3)===" - "){return"-"+e.substring(3,e.length)}else if(e.substring(0,3)===" + "){return e.substring(3,e.length)}else{return"0"}};o.prototype.toTex=function(e){var t="";for(var r=0;r<this.terms.length;r++){var n=this.terms[r];t+=(n.coefficients[0].valueOf()<0?" - ":" + ")+n.toTex(e)}for(var r=0;r<this.constants.length;r++){var i=this.constants[r];t+=(i.valueOf()<0?" - ":" + ")+i.abs().toTex()}if(t.substring(0,3)===" - "){return"-"+t.substring(3,t.length)}else if(t.substring(0,3)===" + "){return t.substring(3,t.length)}else{return"0"}};o.prototype._removeTermsWithCoefficientZero=function(){this.terms=this.terms.filter(function(e){return e.coefficient().reduce().numer!==0});return this};o.prototype._combineLikeTerms=function(){function e(e,t){for(var r=0;r<t.length;r++){if(e.canBeCombinedWith(t[r])){return true}}return false}var t=[];var r=[];for(var n=0;n<this.terms.length;n++){var i=this.terms[n];if(e(i,r)){continue}else{for(var s=n+1;s<this.terms.length;s++){var o=this.terms[s];if(i.canBeCombinedWith(o)){i=i.add(o)}}t.push(i);r.push(i)}}this.terms=t;return this};o.prototype._moveTermsWithDegreeZeroToConstants=function(){var e=[];var t=new n(0,1);for(var r=0;r<this.terms.length;r++){var i=this.terms[r];if(i.variables.length===0){t=t.add(i.coefficient())}else{e.push(i)}}this.constants.push(t);this.terms=e;return this};o.prototype._sort=function(){function e(e,t){var r=e.maxDegree();var n=t.maxDegree();if(r===n){var i=e.variables.length;var s=t.variables.length;return s-i}else{return n-r}}this.terms=this.terms.sort(e);return this};o.prototype._hasVariable=function(e){for(var t=0;t<this.terms.length;t++){if(this.terms[t].hasVariable(e)){return true}}return false};o.prototype._onlyHasVariable=function(e){for(var t=0;t<this.terms.length;t++){if(!this.terms[t].onlyHasVariable(e)){return false}}return true};o.prototype._noCrossProductsWithVariable=function(e){for(var t=0;t<this.terms.length;t++){var r=this.terms[t];if(r.hasVariable(e)&&!r.onlyHasVariable(e)){return false}}return true};o.prototype._noCrossProducts=function(){for(var e=0;e<this.terms.length;e++){var t=this.terms[e];if(t.variables.length>1){return false}}return true};o.prototype._maxDegree=function(){return this.terms.reduce(function(e,t){return Math.max(e,t.maxDegree())},1)};o.prototype._maxDegreeOfVariable=function(e){return this.terms.reduce(function(t,r){return Math.max(t,r.maxDegreeOfVariable(e))},1)};o.prototype._quadraticCoefficients=function(){var e;var t=new n(0,1);for(var r=0;r<this.terms.length;r++){var i=this.terms[r];e=i.maxDegree()===2?i.coefficient().copy():e;t=i.maxDegree()===1?i.coefficient().copy():t}var s=this.constant();return{a:e,b:t,c:s}};o.prototype._cubicCoefficients=function(){var e;var t=new n(0,1);var r=new n(0,1);for(var i=0;i<this.terms.length;i++){var s=this.terms[i];e=s.maxDegree()===3?s.coefficient().copy():e;t=s.maxDegree()===2?s.coefficient().copy():t;r=s.maxDegree()===1?s.coefficient().copy():r}var o=this.constant();return{a:e,b:t,c:r,d:o}};Term=function(e){if(e instanceof a){this.variables=[e.copy()]}else if(typeof e==="undefined"){this.variables=[]}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Term initializer must be of type Variable.")}this.coefficients=[new n(1,1)]};Term.prototype.coefficient=function(){return this.coefficients.reduce(function(e,t){return e.multiply(t)},new n(1,1))};Term.prototype.simplify=function(){var e=this.copy();e.coefficients=[this.coefficient()];e.combineVars();return e.sort()};Term.prototype.combineVars=function(){var e={};for(var t=0;t<this.variables.length;t++){var r=this.variables[t];if(r.variable in e){e[r.variable]+=r.degree}else{e[r.variable]=r.degree}}var n=[];for(var i in e){var s=new a(i);s.degree=e[i];n.push(s)}this.variables=n;return this};Term.prototype.copy=function(){var e=new Term;e.coefficients=this.coefficients.map(function(e){return e.copy()});e.variables=this.variables.map(function(e){return e.copy()});return e};Term.prototype.add=function(e){if(e instanceof Term&&this.canBeCombinedWith(e)){var t=this.copy();t.coefficients=[t.coefficient().add(e.coefficient())];return t}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Summand must be of type String, Expression, Term, Fraction or Integer.")}};Term.prototype.subtract=function(e){if(e instanceof Term&&this.canBeCombinedWith(e)){var t=this.copy();t.coefficients=[t.coefficient().subtract(e.coefficient())];return t}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Subtrahend must be of type String, Expression, Term, Fraction or Integer.")}};Term.prototype.multiply=function(e,t){var r=this.copy();if(e instanceof Term){r.variables=r.variables.concat(e.variables);r.coefficients=e.coefficients.concat(r.coefficients)}else if(i(e)||e instanceof n){var s=i(e)?new n(e,1):e;if(r.variables.length===0){r.coefficients.push(s)}else{r.coefficients.unshift(s)}}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Multiplicand must be of type String, Expression, Term, Fraction or Integer.")}return t||t===undefined?r.simplify():r};Term.prototype.divide=function(e,t){if(i(e)||e instanceof n){var r=this.copy();r.coefficients=r.coefficients.map(function(r){return r.divide(e,t)});return r}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Argument must be of type Fraction or Integer.")}};Term.prototype.eval=function(e,t){var r=this.copy();var s=Object.keys(e);var a=r.coefficients.reduce(function(e,r){return e.multiply(r,t)},new o(1));for(var u=0;u<r.variables.length;u++){var f=r.variables[u];var l;if(f.variable in e){var c=e[f.variable];if(c instanceof n||c instanceof o){l=c.pow(f.degree)}else if(i(c)){l=Math.pow(c,f.degree)}else{throw new TypeError("Invalid Argument ("+c+"): Can only evaluate Expressions or Fractions.")}}else{l=new o(f.variable).pow(f.degree)}a=a.multiply(l,t)}return a};Term.prototype.hasVariable=function(e){for(var t=0;t<this.variables.length;t++){if(this.variables[t].variable===e){return true}}return false};Term.prototype.maxDegree=function(){return this.variables.reduce(function(e,t){return Math.max(e,t.degree)},1)};Term.prototype.maxDegreeOfVariable=function(e){return this.variables.reduce(function(t,r){return r.variable===e?Math.max(t,r.degree):t},1)};Term.prototype.canBeCombinedWith=function(e){var t=this.variables;var r=e.variables;if(t.length!=r.length){return false}var n=0;for(var i=0;i<t.length;i++){for(var s=0;s<r.length;s++){if(t[i].variable===r[s].variable&&t[i].degree===r[s].degree){n+=1}}}return n===t.length};Term.prototype.onlyHasVariable=function(e){for(var t=0;t<this.variables.length;t++){if(this.variables[t].variable!=e){return false}}return true};Term.prototype.sort=function(){function e(e,t){return t.degree-e.degree}this.variables=this.variables.sort(e);return this};Term.prototype.toString=function(){var e="";for(var t=0;t<this.coefficients.length;t++){var r=this.coefficients[t];if(r.abs().numer!==1||r.abs().denom!==1){e+=" * "+r.toString()}}e=this.variables.reduce(function(e,t){return e.concat(t.toString())},e);e=e.substring(0,3)===" * "?e.substring(3,e.length):e;e=e.substring(0,1)==="-"?e.substring(1,e.length):e;return e};Term.prototype.toTex=function(e){var e=e===undefined?{}:e;e.multiplication=!("multiplication"in e)?"cdot":e.multiplication;var t=" \\"+e.multiplication+" ";var r="";for(var n=0;n<this.coefficients.length;n++){var i=this.coefficients[n];if(i.abs().numer!==1||i.abs().denom!==1){r+=t+i.toTex()}}r=this.variables.reduce(function(e,t){return e.concat(t.toTex())},r);r=r.substring(0,t.length)===t?r.substring(t.length,r.length):r;r=r.substring(0,1)==="-"?r.substring(1,r.length):r;r=r.substring(0,7)==="\\frac{-"?"\\frac{"+r.substring(7,r.length):r;return r};var a=function(e){if(typeof e==="string"){this.variable=e;this.degree=1}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Variable initalizer must be of type String.")}};a.prototype.copy=function(){var e=new a(this.variable);e.degree=this.degree;return e};a.prototype.toString=function(){var e=this.degree;var t=this.variable;if(e===0){return""}else if(e===1){return t}else{return t+"^"+e}};a.prototype.toTex=function(){var e=this.degree;var t=this.variable;if(s.indexOf(t)>-1){t="\\"+t}if(e===0){return""}else if(e===1){return t}else{return t+"^{"+e+"}"}};t.exports={Expression:o,Term:Term,Variable:a}},{"./fractions":4,"./helper":5}],4:[function(e,t,r){var n=e("./helper").isInt;var i=e("./helper").gcd;var s=e("./helper").lcm;var o=function(e,t){if(t===0){throw new EvalError("Divide By Zero")}else if(n(e)&&n(t)){this.numer=e;this.denom=t}else{throw new TypeError("Invalid Argument ("+e.toString()+","+t.toString()+"): Divisor and dividend must be of type Integer.")}};o.prototype.copy=function(){return new o(this.numer,this.denom)};o.prototype.reduce=function(){var e=this.copy();var t=i(e.numer,e.denom);e.numer=e.numer/t;e.denom=e.denom/t;if(Math.sign(e.denom)==-1&&Math.sign(e.numer)==1){e.numer*=-1;e.denom*=-1}return e};o.prototype.equalTo=function(e){if(e instanceof o){var t=this.reduce();var r=e.reduce();return t.numer===r.numer&&t.denom===r.denom}else{return false}};o.prototype.add=function(e,t){t=t===undefined?true:t;var r,i;if(e instanceof o){r=e.numer;i=e.denom}else if(n(e)){r=e;i=1}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Summand must be of type Fraction or Integer.")}var a=this.copy();if(this.denom==i){a.numer+=r}else{var u=s(a.denom,i);var f=u/a.denom;var l=u/i;a.numer*=f;a.denom*=f;r*=l;a.numer+=r}return t?a.reduce():a};o.prototype.subtract=function(e,t){t=t===undefined?true:t;var r=this.copy();if(e instanceof o){return r.add(new o(-e.numer,e.denom),t)}else if(n(e)){return r.add(new o(-e,1),t)}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Subtrahend must be of type Fraction or Integer.")}};o.prototype.multiply=function(e,t){t=t===undefined?true:t;var r,i;if(e instanceof o){r=e.numer;i=e.denom}else if(n(e)&&e){r=e;i=1}else if(e===0){r=0;i=1}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Multiplicand must be of type Fraction or Integer.")}var s=this.copy();s.numer*=r;s.denom*=i;return t?s.reduce():s};o.prototype.divide=function(e,t){t=t===undefined?true:t;if(e.valueOf()===0){throw new EvalError("Divide By Zero")}var r=this.copy();if(e instanceof o){return r.multiply(new o(e.denom,e.numer),t)}else if(n(e)){return r.multiply(new o(1,e),t)}else{throw new TypeError("Invalid Argument ("+e.toString()+"): Divisor must be of type Fraction or Integer.")}};o.prototype.pow=function(e,t){t=t===undefined?true:t;var r=this.copy();r.numer=Math.pow(r.numer,e);r.denom=Math.pow(r.denom,e);return t?r.reduce():r};o.prototype.abs=function(){var e=this.copy();e.numer=Math.abs(e.numer);e.denom=Math.abs(e.denom);return e};o.prototype.valueOf=function(){return this.numer/this.denom};o.prototype.toString=function(){if(this.numer===0){return"0"}else if(this.denom===1){return this.numer.toString()}else if(this.denom===-1){return(-this.numer).toString()}else{return this.numer+"/"+this.denom}};o.prototype.toTex=function(){if(this.numer===0){return"0"}else if(this.denom===1){return this.numer.toString()}else if(this.denom===-1){return(-this.numer).toString()}else{return"\\frac{"+this.numer+"}{"+this.denom+"}"}};o.prototype._squareRootIsRational=function(){if(this.valueOf()===0){return true}var e=Math.sqrt(this.numer);var t=Math.sqrt(this.denom);return n(e)&&n(t)};o.prototype._cubeRootIsRational=function(){if(this.valueOf()===0){return true}var e=Math.cbrt(this.numer);var t=Math.cbrt(this.denom);return n(e)&&n(t)};t.exports=o},{"./helper":5}],5:[function(e,t,r){function n(e,t){while(t){var r=e;e=t;t=r%t}return e}function i(e,t){return e*t/n(e,t)}function s(e){return typeof e=="number"&&e%1===0}function o(e,t){t=typeof t==="undefined"?2:t;var r=Math.pow(10,t);return Math.round(parseFloat(e)*r)/r}var a=["alpha","beta","gamma","Gamma","delta","Delta","epsilon","varepsilon","zeta","eta","theta","vartheta","Theta","iota","kappa","lambda","Lambda","mu","nu","xi","Xi","pi","Pi","rho","varrho","sigma","Sigma","tau","upsilon","Upsilon","phi","varphi","Phi","chi","psi","Psi","omega","Omega"];r.gcd=n;r.lcm=i;r.isInt=s;r.round=o;r.GREEK_LETTERS=a},{}],6:[function(e,t,r){"use strict";var n=function(){this.pos=0;this.buf=null;this.buflen=0;this.optable={"+":"PLUS","-":"MINUS","*":"MULTIPLY","/":"DIVIDE","^":"POWER","(":"L_PAREN",")":"R_PAREN","=":"EQUALS"}};n.prototype.input=function(e){this.pos=0;this.buf=e;this.buflen=e.length};n.prototype.token=function(){this._skipnontokens();if(this.pos>=this.buflen){return null}var e=this.buf.charAt(this.pos);var t=this.optable[e];if(t!==undefined){if(t==="L_PAREN"||t==="R_PAREN"){return{type:"PAREN",value:t,pos:this.pos++}}else{return{type:"OPERATOR",value:t,pos:this.pos++}}}else{if(n._isalpha(e)){return this._process_identifier()}else if(n._isdigit(e)){return this._process_number()}else{throw new SyntaxError("Token error at character "+e+" at position "+this.pos)}}};n._isdigit=function(e){return e>="0"&&e<="9"};n._isalpha=function(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"};n._isalphanum=function(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"||e>="0"&&e<="9"};n.prototype._process_digits=function(e){var t=e;while(t<this.buflen&&n._isdigit(this.buf.charAt(t))){t++}return t};n.prototype._process_number=function(){var e=this._process_digits(this.pos);if(this.buf.charAt(e)==="."){e=this._process_digits(e+1)}if(this.buf.charAt(e-1)==="."){throw new SyntaxError("Decimal point without decimal digits at position "+(e-1))}var t={type:"NUMBER",value:this.buf.substring(this.pos,e),pos:this.pos};this.pos=e;return t};n.prototype._process_identifier=function(){var e=this.pos+1;while(e<this.buflen&&n._isalphanum(this.buf.charAt(e))){e++}var t={type:"IDENTIFIER",value:this.buf.substring(this.pos,e),pos:this.pos};this.pos=e;return t};n.prototype._skipnontokens=function(){while(this.pos<this.buflen){var e=this.buf.charAt(this.pos);if(e==" "||e=="	"||e=="\r"||e=="\n"){this.pos++}else{break}}};t.exports=n},{}],7:[function(e,t,r){"use strict";var n=e("./lexer"),i=e("./expressions").Expression,s=e("./fractions"),o=e("./equations");var a=function(){this.lexer=new n;this.current_token=null};a.prototype.update=function(){this.current_token=this.lexer.token()};a.prototype.match=function(e){if(this.current_token===null)return e==="epsilon";switch(e){case"plus":return this.current_token.type==="OPERATOR"&&this.current_token.value==="PLUS";case"minus":return this.current_token.type==="OPERATOR"&&this.current_token.value==="MINUS";case"multiply":return this.current_token.type==="OPERATOR"&&this.current_token.value==="MULTIPLY";case"power":return this.current_token.type==="OPERATOR"&&this.current_token.value==="POWER";case"divide":return this.current_token.type==="OPERATOR"&&this.current_token.value==="DIVIDE";case"equal":return this.current_token.type==="OPERATOR"&&this.current_token.value==="EQUALS";case"lparen":return this.current_token.type==="PAREN"&&this.current_token.value==="L_PAREN";case"rparen":return this.current_token.type==="PAREN"&&this.current_token.value==="R_PAREN";case"num":return this.current_token.type==="NUMBER";case"id":return this.current_token.type==="IDENTIFIER";default:return false}};a.prototype.parse=function(e){this.lexer.input(e);this.update();return this.parseEqn()};a.prototype.parseEqn=function(){var e=this.parseExpr();if(this.match("equal")){this.update();var t=this.parseExpr();return new o(e,t)}else if(this.match("epsilon")){return e}else{throw new SyntaxError("Unbalanced Parenthesis")}};a.prototype.parseExpr=function(){var e=this.parseTerm();return this.parseExprRest(e)};a.prototype.parseExprRest=function(e){if(this.match("plus")){this.update();var t=this.parseTerm();if(e===undefined||t===undefined)throw new SyntaxError("Missing operand");return this.parseExprRest(e.add(t))}else if(this.match("minus")){this.update();var r=this.parseTerm();if(e===undefined){return this.parseExprRest(r.multiply(-1))}else{return this.parseExprRest(e.subtract(r))}}else{return e}};a.prototype.parseTerm=function(){var e=this.parseFactor();return this.parseTermRest(e)};a.prototype.parseTermRest=function(e){if(this.match("multiply")){this.update();var t=this.parseFactor();return e.multiply(this.parseTermRest(t))}else if(this.match("power")){this.update();var r=this.parseFactor();return this.parseTermRest(e.pow(parseInt(r.toString())))}else if(this.match("divide")){this.update();var n=this.parseFactor();return this.parseTermRest(e.divide(this.convertToFraction(n)))}else if(this.match("epsilon")){return e}else{var i=this.parseFactor();if(i===undefined){return e}else{return e.multiply(this.parseTermRest(i))}}};a.prototype.convertToFraction=function(e){if(e.terms.length>0){throw new TypeError("Invalid Argument ("+e.toString()+"): Divisor must be of type Integer or Fraction.")}else{var t=e.constants[0];return new s(t.numer,t.denom)}};a.prototype.parseFactor=function(){if(this.match("num")){var e=this.parseNumber();this.update();return e}else if(this.match("id")){var t=new i(this.current_token.value);this.update();return t}else if(this.match("lparen")){this.update();var r=this.parseExpr();if(this.match("rparen")){this.update();return r}else{throw new SyntaxError("Unbalanced Parenthesis")}}else{return undefined}};a.prototype.parseNumber=function(){if(parseInt(this.current_token.value)==this.current_token.value){return new i(parseInt(this.current_token.value))}else{var e=this.current_token.value.split(".");var t=e[1].length;var r=Math.pow(10,t);var n=parseFloat(this.current_token.value);return new i(parseInt(n*r)).divide(r)}};t.exports=a},{"./equations":2,"./expressions":3,"./fractions":4,"./lexer":6}]},{},[1])(1)});
;
var H5P = H5P || {};

/**
 * Defines the H5P.ArithmeticQuiz class
 */
H5P.ArithmeticQuiz = (function ($) {

  /**
   * Creates a new ArithmeticQuiz instance
   *
   * @class
   * @augments H5P.EventDispatcher
   * @namespace H5P
   * @param {Object} options
   * @param {number} id
   */
  function ArithmeticQuiz(options, id) {
    // Add viewport meta to iframe
    $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">');

    var self = this;
    // Extend defaults with provided options
    self.options = $.extend(true, {}, {
      intro: '',
      quizType: 'arithmetic',
      arithmeticType: 'addition',
      equationType: undefined,
      useFractions: undefined,
      maxQuestions: undefined,
      UI: {
        score: 'Score @score',
        scoreInPercent: '(@percent% correct)',
        time: 'Time: @time',
        resultPageHeader: 'Finished!',
        retryButton: 'Retry',
        startButton: 'Start',
        go: 'GO!',
        correctText: 'Correct',
        incorrectText: 'Incorrect. Correct answer was :num',
        durationLabel: 'Duration in hours, minutes and seconds.',
        humanizedQuestion: 'What does :arithmetic equal?',
        humanizedEquation: 'For the equation :equation, what does :item equal?',
        humanizedVariable: 'What does :item equal?',
        plusOperator: 'plus',
        minusOperator: 'minus',
        multiplicationOperator: 'times',
        divisionOperator: 'divided by',
        equalitySign: 'equal',
        slideOfTotal: 'Slide :num of :total'
      }
    }, options);
    self.currentWidth = 0;

    self.gamePage = new H5P.ArithmeticQuiz.GamePage(self.options.quizType, self.options, id);
    
    self.gamePage.on('last-slide', function (e) {
      self.triggerXAPIScored(e.data.score, e.data.numQuestions, 'answered');
    });

    self.gamePage.on('started-quiz', function () {
      self.setActivityStarted();
    });

    self.gamePage.on('alternative-chosen', function () {
      self.triggerXAPI('interacted');
    });

    self.introPage = new H5P.ArithmeticQuiz.IntroPage(self.options.intro, self.options.UI);
    self.introPage.on('start-game', function() {
      self.introPage.remove();
      self.gamePage.startCountdown();
    });

    self.on('resize', function () {
      // Set size based on gamePage
      var height = self.gamePage.getMaxHeight() + 'px';
      this.$container.css({height: height});
      // Need to set height in pixels because of FF-bug
      $('.h5p-baq-countdown').css({height: height});
      $('.h5p-baq-result-page').css({height: height});
    });


    /**
     * Attach function called by H5P framework to insert H5P content into page
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (self.isRoot()) {
        self.setActivityStarted();
      }

      if (this.$container === undefined) {
        this.$container = $container;
        this.$container.addClass('h5p-baq');
        this.introPage.appendTo($container);

        // Set gamePage xAPI parameters and append it.
        self.gamePage.contentId = id;
        self.gamePage.libraryInfo = self.libraryInfo;
        self.gamePage.appendTo(self.$container);

        self.trigger('resize');

        setTimeout(function () {
          H5P.ArithmeticQuiz.SoundEffects.setup(self.getLibraryFilePath(''));
        }, 1);
      }
    };
  }

  /**
   * Replaces placeholders in translatables texts
   *
   * @static
   * @param  {String} text description
   * @param  {Object} vars description
   * @return {String}      description
   */
  ArithmeticQuiz.tReplace = function (text, vars) {
    for (var placeholder in vars) {
      text = text.replace('@'+placeholder, vars[placeholder]);
    }
    return text;
  };

  return ArithmeticQuiz;
})(H5P.jQuery);

/**
 * Enum defining the different arithmetic types
 * @readonly
 * @enum {string}
 */
H5P.ArithmeticQuiz.ArithmeticType = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division'
};

/**
 * Enum defining the different equation types
 * @readonly
 * @enum {string}
 */
H5P.ArithmeticQuiz.EquationType = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

/**
 * Enum defining the different quiz types
 * @readonly
 * @enum {string}
 */
H5P.ArithmeticQuiz.QuizType = {
  ARITHMETIC: 'arithmetic',
  LINEAREQUATION: 'linearEquation'
};;
H5P.ArithmeticQuiz.SoundEffects = (function () {
  let isDefined = false;

  var SoundEffects = {
    types: [
      'positive-short',
      'negative-short'
    ],
    sounds: [],
    muted: false
  };

  const players = {};

  /**
   * Setup defined sounds
   *
   * @return {boolean} True if setup was successfull, otherwise false
   */
  SoundEffects.setup = function (libraryPath) {
    if (isDefined) {
      return false;
    }
    isDefined = true;

    SoundEffects.types.forEach(async (type) => {
      const player = new Audio();
      const extension = player.canPlayType('audio/ogg') ? 'ogg' : 'mp3';
      const response = await fetch(libraryPath + 'sounds/' + type + '.' + extension);
      const data = await response.blob();
      player.src = URL.createObjectURL(data);
      players[type] = player;
    });

    return true;
  };

  /**
   * Play a sound
   *
   * @param  {string} type  Name of the sound as defined in [SoundEffects.types]
   * @param  {number} delay Delay in milliseconds
   */
  SoundEffects.play = function (type, delay) {
    if (SoundEffects.muted === false) {
      if (!players[type]) {
        return;
      }
      setTimeout(function () {
        players[type].play();
      }, delay || 0);
    }
  };

  /**
   * Mute. Subsequent invocations of SoundEffects.play() will not make any sounds beeing played.
   */
  SoundEffects.mute = function () {
    SoundEffects.muted = true;
  };

  /**
   * Unmute
   */
  SoundEffects.unmute = function () {
    SoundEffects.muted = false;
  };

  return SoundEffects;
})();
;
/**
 * Defines the H5P.ArithmeticQuiz.CountdownWidget class
 */
H5P.ArithmeticQuiz.CountdownWidget = (function ($) {

  /**
   * A count down widget
   *
   * @class
   * @augments H5P.EventDispatcher
   * @namespace H5P.ArithmeticQuiz
   * @fires H5P.Event
   *
   * @param {number} seconds Number of seconds to count down
   * @param {Object} t Translations
   */
  function CountdownWidget(seconds, t) {
    H5P.EventDispatcher.call(this);
    var originalSeconds = seconds;

    this.$countdownWidget = $('<div>', {
      'class': 'h5p-baq-countdown',
      'aria-hidden': true
    }).append($('<div>', {
      'class': 'h5p-baq-countdown-inner',
    }).append($('<span>', {
      'class': 'h5p-baq-countdown-text',
      text: seconds,
      'aria-live': 'polite'
    }), $('<span>', {
      'class': 'h5p-baq-countdown-bg'
    })));

    this.$countdownText = this.$countdownWidget.find('.h5p-baq-countdown-text');

    /**
     * Returns reference to DOM object
     *
     * @return {H5P.jQuery}
     */
    this.create = function () {
      return this.$countdownWidget;
    };


    /**
     * Start countdown
     */
    this.start = function () {
      var self = this;
      this.$countdownWidget.attr('aria-hidden', false);

      if (!self.$countdownWidget.find('.h5p-baq-countdown-bg').hasClass('fuel')) {
        setTimeout(function(){
          self.$countdownWidget.find('.h5p-baq-countdown-bg').addClass('fuel');
        },1);
      }

      if (seconds <= 0) {
        self.$countdownWidget.attr('aria-hidden', true);
        self.trigger('ignition');
        return;
      }

      self.decrement();

      setTimeout(function(){
        self.start();
      }, 1000);
    };


    /**
     * Restart the countdown
     */
    this.restart = function () {
      var self = this;
      seconds = originalSeconds+1;
      self.decrement();
      self.$countdownWidget.find('.h5p-baq-countdown-bg').removeClass('fuel');
      setTimeout(function () {
        self.start();
      }, 600);
    };


    /**
     * Decrement counter
     */
    this.decrement = function () {
      seconds--;
      this.$countdownText.html(seconds === 0 ? t.go : seconds);
    };
  }
  CountdownWidget.prototype = Object.create(H5P.EventDispatcher.prototype);
  CountdownWidget.prototype.constructor = CountdownWidget;

  return CountdownWidget;

})(H5P.jQuery);
;
H5P.ArithmeticQuiz.TimerWidget = (function ($) {

  /**
   * Creates a TimerWidget instance
   *
   * @class
   * @namespace H5P.ArithmeticQuiz
   *
   * @param  {type} t Translation object
   */
  function TimerWidget(t) {
    var totalTime = 0;
    var isRunning = false;
    var timer;
    var startTime = 0;
    var incrementingAria = true;

    var $timer = $('<time>', {
      'aria-label': t.durationLabel,
      'class': 'timer',
      role: 'timer',
      'aria-hidden': true,
      text: H5P.ArithmeticQuiz.tReplace(t.time, {time: '00:00'})
    });

    /**
     * Create an aria timer that will not update when it has been focus by a readspeaker
     *
     * Technical note: This is needed because when a readspeaker is on top of an element and that element changes
     * the focus will be moved back to the previous element. When this happens every second like
     * here it makes it impossible to move forward in the task whenever the timer is updated.
     * Therefore we do not update the readable element when it is focused.
     */
    var $ariaTimer = $('<time>', {
      'aria-label': t.durationLabel,
      'class': 'timer aria-timer',
      role: 'timer',
      tabindex: '-1',
      text: H5P.ArithmeticQuiz.tReplace(t.time, {time: '0'})
    });

    $ariaTimer.on('focus', function () {
      incrementingAria = false;
    });

    $ariaTimer.on('blur', function () {
      incrementingAria = true;
    });

    /**
     * Humanize time
     *
     * @private
     * @param  {number} seconds Number of seconds to humanize
     * @param  {string} [separator] Separator used between the different time units
     * @return {string} The humanized time
     */
    var humanizeTime = function (seconds, separator) {
      separator = separator || ':';
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);

      minutes = minutes % 60;
      seconds = Math.floor(seconds % 60);

      var time = '';

      if (hours !== 0) {
        time += hours + separator;

        if (minutes < 10) {
          time += '0';
        }
      }

      if (minutes < 10) {
        time += '0';
      }

      time += minutes + separator;

      if (seconds < 10) {
        time += '0';
      }

      time += seconds;

      return time;
    };


    /**
     * Calculate running time
     *
     * @private
     * @return {number} Running time in seconds
     */
    var getTime = function () {
      return totalTime + (isRunning ? new Date().getTime() - startTime : 0);
    };


    /**
     * Update UI
     *
     * @private
     */
    var update = function () {
      $timer.text(H5P.ArithmeticQuiz.tReplace(t.time, {time: humanizeTime(getTime()/1000)}));

      if (incrementingAria) {
        $ariaTimer.text(H5P.ArithmeticQuiz.tReplace(t.time, {time: humanizeTime(getTime()/1000, ', ')}));
      }

      timer = setTimeout(function(){
        update();
      }, 1000);
    };


    /**
     * Append me to something
     *
     * @param  {H5P.jQuery} $container
     */
    this.appendTo = function ($container) {
      $timer.appendTo($container);
      $ariaTimer.appendTo($container);
    };


    /**
     * Start the timer
     */
    this.start = function () {
      isRunning = true;
      clearTimeout(timer);
      startTime = new Date().getTime();
      update();
    };


    /**
     * Pause the timer
     *
     * @return {string} The humanized time
     */
    this.pause = function () {
      isRunning = false;
      totalTime += new Date().getTime() - startTime;
      clearTimeout(timer);
      update();

      return humanizeTime(getTime()/1000);
    };


    /**
     * Reset timer
     */
    this.reset = function () {
      clearTimeout(timer);
      isRunning = false;
      totalTime = 0;
      startTime = 0;
      update();
    };


    /**
     * Restart timer
     */
    this.restart = function () {
      this.reset();
      this.start();
    };
  }

  return TimerWidget;

})(H5P.jQuery);
;
H5P.ArithmeticQuiz.IntroPage = (function ($, UI) {
  /**
   * Creates an IntroPage instance
   *
   * @class
   * @namespace H5P.ArithmeticQuiz
   * @augments H5P.EventDispatcher
   *
   * @param  {string} text Introduction text
   * @param  {Object} t Translation object
   * @fires H5P.Event
   */
  function IntroPage(text, t) {
    H5P.EventDispatcher.call(this);
    var self = this;

    this.$introPage = $('<div>', {
      'class': 'h5p-baq-intro-page'
    });

    var $innerWrapper = $('<div>', {
      'class': 'h5p-baq-intro-page-inner'
    });

    $innerWrapper.append($('<div>', {
      'class': 'h5p-baq-intro-page-title'
    }).append($('<span>', {
      html: text
    })));

    // Create and add the start button:
    UI.createButton({
      text: t.startButton,
      'class': 'mq-control-button',
      click: function () {
        self.trigger('start-game');
      }
    }).appendTo($innerWrapper);

    $innerWrapper.appendTo(this.$introPage);

    /**
     * Append Intropage to a container
     *
     * @param  {H5P.jQuery} $container
     */
    self.appendTo = function ($container) {
      this.$introPage.appendTo($container);
    };


    /**
     * Remove me from DOM
     */
    self.remove = function () {
      this.$introPage.remove();
    };
  }

  IntroPage.prototype = Object.create(H5P.EventDispatcher.prototype);
  IntroPage.prototype.constructor = IntroPage;

  return IntroPage;

})(H5P.jQuery, H5P.JoubelUI);
;
/**
 * Defines the H5P.ArithmeticQuiz.EquationsGenerator class
 */
H5P.ArithmeticQuiz.EquationsGenerator = (function (EquationType) {
  var unknown = ["x", "y", "z", "a", "b"];
  var Fraction = algebra.Fraction;
  var Expression = algebra.Expression;
  var Equation = algebra.Equation;

  // Helper functions for creating wrong alternatives
  function add (question, param) {
    return question.correct + param;
  }
  function subtract (question, param) {
    return question.correct - param;
  }

  function randomNum (min, max) {
    min = min || 1;
    max = max || 7;

    // Creates random number between min and max:
    var num = Math.floor(Math.random()*(max-min+1)+min);
    if (num === 0) {
      num = randomNum(min, max);
    }
    return num;
  }
  function multiply (question, param) {
    if (Math.random() > 0.5) {
      return (question.x+param) * question.y;
    }
    else {
      return (question.y+param) * question.x;
    }
  }
  function divide (question, param) {
    if (Math.random() > 0.5) {
      return Math.floor((question.x + param) / question.y);
    }
    else {
      return Math.floor(question.x / (question.y + param));
    }
  }

  //
  /**
   * Do a random operation on equation expression
   * @method randomOperation
   * @param  {operations}  array of operations to choose from randomly
   * @param  {expr}  algebra.js expression
   * @param  {useFractions}  use fractions as number
   */
  function randomOperation(operations, expr, useFractions) {
    // get a random operation
    var operation = operations[Math.floor(Math.random() * operations.length)];
    var number = randomNum(1, 7);
    switch (operation) {
      case "/":
        if (number > 0) {
          expr = expr.divide(number);
        }
        break;
      case "*":
        expr = expr.multiply(number);
        break;
      case "+":
        if (useFractions === true) {
          number = new Fraction(randomNum(1, 7), randomNum(3, 7));
        }
        expr = expr.add(number);
        break;
      case "-":
        if (useFractions === true) {
          number = new Fraction(randomNum(1, 7), randomNum(3, 7));
        }
        expr = expr.subtract(number);
        break;
    }
    return expr;
  }

  /**
   * Generates equation type for a question
   * @method generateEquation
   * @param  {item}  variable name of expression
   * @param  {expr}  algebra.js expression
   * @param  {equationType}  type of equation (basic, intermediate, advanced)
   * @param  {useFractions}  use fractions as number
   */
  function generateEquation(item, type, equationType, useFractions) {
    var equation = undefined;
    var solution = undefined;
    var number1 = undefined;
    var operations = undefined;

    number1 = randomNum();

    if (useFractions === true) {
      number1 = new Fraction(randomNum(), randomNum(3, 7));
    }

    var expression1 = new Expression(item);
    var expression2 = new Expression(item);

    switch (equationType) {
      case EquationType.BASIC:
        // [ 3x = 12 ]
        expression1 = expression1.multiply(randomNum(2, 4));
        equation = new Equation(expression1, number1);
        break;
      case EquationType.INTERMEDIATE:
        // [ 4x - 3 = 13 ]
        operations = ["+", "-"];
        expression1 = randomOperation(operations, expression1, useFractions);
        expression1 = expression1.multiply(randomNum(2, 3));
        equation = new Equation(expression1, number1);
        break;
      case EquationType.ADVANCED:
        // [ 5x + 3 = 3x + 15 ]
        operations = ["+", "-"];
        // expression1 = expression1.multiply(item); // Quadratic equations ..
        expression1 = randomOperation(operations, expression1, useFractions);
        expression2 = randomOperation(operations, expression2, useFractions);
        expression1 = expression1.multiply(randomNum(2, 3));
        expression2 = expression2.multiply(randomNum(2, 3));
        expression1 = expression1.simplify();
        expression2 = expression2.simplify();
        equation = new Equation(expression1, expression2);
        break;
    }
    try {
      solution = equation.solveFor(item);
    } catch(err) {
      equation = generateEquation(item, type, equationType, useFractions);
      solution = equation.solveFor(item);
    }
    if ( (solution.toString() === "0") || (solution.toString() === "1") || solution.toString().length > 4) {
      // Rebuild
      equation = generateEquation(item, type, equationType, useFractions);
    }

    return equation;
  }

  /**
   * Equation Questions generator classes
   * @method EquationsGenerator
   * @constructor
   * @param  {H5P.ArithmeticQuiz.ArithmeticType}   type
   * @param  {H5P.ArithmeticQuiz.EquationType}   equationType
   * @param  {number}           maxQuestions
   * @param  {boolean}          use fractions in equations
   */
  function EquationsGenerator(type, equationType, maxQuestions, useFractions) {
    var self = this;
    var questions = [];
    var i, j;

    /**
     * Generates alternative for a question
     * @method generateAlternatives
     * @param  {Object}             question
     * @param  {H5P.ArithmeticQuiz.EquationType}   equation type
     * @param  {boolean}          use fractions in equations
     */
    function generateAlternatives(question, equationType, useFractions) {
      question.alternatives = [];
      var equation = undefined;
      // Generate 5 wrong ones:
      while (question.alternatives.length !== 5) {
        equation = generateEquation(question.variable, question.type, equationType, useFractions);
        var solution = equation.solveFor(question.variable).toString();

        // check if alternative is present already and is not the correct one
        if (solution !== question.correct && question.alternatives.indexOf(solution) === -1) {
          question.alternatives.push(solution);
        }
      }

      // Add correct one
      question.alternatives.push(question.correct);

      // Shuffle alternatives:
      question.alternatives = H5P.shuffleArray(question.alternatives);
    }

    // Generate equations
    for (i=50; i>=0; i--) {
      for (j=i; j>=0; j--) {
        var item = unknown[Math.floor(Math.random()*unknown.length)];
        var equation = generateEquation(item, type, equationType, useFractions);
        var solution = equation.solveFor(item);
        questions.push({
          variable: item,
          expression: equation.toString(),
          correct: solution.toString(),
          textual: equation.toString(),
        });
      }
    }

    // Let's shuffle
    questions = H5P.shuffleArray(questions);

    if (questions.length > maxQuestions) {
      questions = questions.slice(0, maxQuestions);
    }

    // Create alternatives
    for (i = 0; i < questions.length; i++) {
      generateAlternatives(questions[i], equationType, useFractions);
    }

    /**
     * Returns the questions including alternatives and textual representation
     * @public
     * @return {array}
     */
    self.get = function () {
      return questions;
    };

  }

  EquationsGenerator.prototype.readableQuestion = function (translations, readableSigns, question) {
    return translations.humanizedEquation
      .replace(':equation', readableSigns)
      .replace(':item', question.variable);
  };

  EquationsGenerator.prototype.readableText = function (question) {
    return question.textual;
  };

  return EquationsGenerator;
}(H5P.ArithmeticQuiz.EquationType));
;
/**
 * Defines the H5P.ArithmeticQuiz.ArithmeticGenerator class
 */
H5P.ArithmeticQuiz.ArithmeticGenerator = (function (ArithmeticType) {

  // Helper functions for creating wrong alternatives
  function add (question, param) {
    return question.correct + param;
  }
  function subtract (question, param) {
    return question.correct - param;
  }
  function randomInt (question) {
    // Creates random number between correct-10 and correct+10:
    return (question.correct - 10) + Math.floor(Math.random() * 20);
  }
  function multiply (question, param) {
    if (Math.random() > 0.5) {
      return (question.x+param) * question.y;
    }
    else {
      return (question.y+param) * question.x;
    }
  }
  function divide (question, param) {
    if (Math.random() > 0.5) {
      return Math.floor((question.x + param) / question.y);
    }
    else {
      return Math.floor(question.x / (question.y + param));
    }
  }

  /**
   * The alternative generator setup for the different arithmetic types
   * @type {Object}
   */
  var alternativesSetup = {};
  alternativesSetup[ArithmeticType.SUBTRACTION] = alternativesSetup[ArithmeticType.ADDITION] = [
    { weight: 0.15, type: add, param: 10 },
    { weight: 0.15, type: subtract, param: 10 },
    { weight: 0.15, type: add, param: 1 },
    { weight: 0.15, type: subtract, param: 1 },
    { weight: 0.15, type: add, param: 2 },
    { weight: 0.15, type: subtract, param: 2 },
    { weight: 0.10, type: randomInt }
  ];
  alternativesSetup[ArithmeticType.MULTIPLICATION] = [
    { weight: 0.15, type: add, param: 10 },
    { weight: 0.15, type: subtract, param: 10 },
    { weight: 0.15, type: add, param: 1 },
    { weight: 0.15, type: subtract, param: 1 },
    { weight: 0.15, type: multiply, param: 1 },
    { weight: 0.15, type: multiply, param: -1 },
    { weight: 0.10, type: randomInt }
  ];
  alternativesSetup[ArithmeticType.DIVISION] = [
    { weight: 0.15, type: add, param: 10 },
    { weight: 0.15, type: subtract, param: 10 },
    { weight: 0.15, type: add, param: 1 },
    { weight: 0.15, type: subtract, param: 1 },
    { weight: 0.15, type: divide, param: 1 },
    { weight: 0.15, type: divide, param: -1 },
    { weight: 0.10, type: randomInt }
  ];

  /**
   * Utility function that picks a alternative setup based on the weight
   * @method getRandomWeightedAlternativeSetup
   * @param  {H5P.ArithmeticQuiz.ArithmeticType} type
   * @return {Object}
   */
  function getRandomWeightedAlternativeSetup (type) {
    var setups = alternativesSetup[type];

    var i;
    var sum = 0;
    var r = Math.random();
    for (i in setups) {
      sum += setups[i].weight;
      if (r <= sum) {
        return setups[i];
      }
    }

    return setups[0];
  }

  /**
   * Arithmetic Questions generator classes
   * @method ArithmeticGenerator
   * @constructor
   * @param  {H5P.ArithmeticQuiz.ArithmeticType}   type
   * @param  {number}           maxQuestions
   */
  function ArithmeticGenerator(type, maxQuestions) {
    var self = this;
    var questions = [];
    var i, j;

    /**
     * Generates alternative for a question
     * @method generateAlternatives
     * @param  {Object}             question
     */
    function generateAlternatives(question) {
      question.alternatives = [];

      // Generate 5 wrong ones:
      while (question.alternatives.length !== 5) {
        var setup = getRandomWeightedAlternativeSetup(type);
        var alternative = setup.type(question, setup.param);
        // check if alternative is present allready and is not the correct one and is not negative number
        if (alternative !== question.correct && question.alternatives.indexOf(alternative) === -1 && alternative >= 0 && alternative <= 100) {
          question.alternatives.push(alternative);
        }
      }

      // Add correct one
      question.alternatives.push(question.correct);

      // Shuffle alternatives:
      question.alternatives = H5P.shuffleArray(question.alternatives);
    }

    /**
     * Creates textual representation for question
     * @method createTextualQuestion
     * @param  {Object}              question Question Object
     * @return {string}
     */
    function createTextualQuestion(question) {
      switch (type) {
        case ArithmeticType.ADDITION:
          return question.x + " + " + question.y;
        case ArithmeticType.SUBTRACTION:
          return question.x + " − " + question.y;
        case ArithmeticType.MULTIPLICATION:
          return question.x + " × " + question.y;
        case ArithmeticType.DIVISION:
          return question.x + " ÷ " + question.y;
        default:
          return '';
      }
    }

    // Generate questions
    switch (type) {
      case ArithmeticType.DIVISION:
      case ArithmeticType.MULTIPLICATION:
        for (i=1; i<10; i++) {
          for (j=1; j<10; j++) {
            questions.push({
              x:  type === ArithmeticType.DIVISION ? i * j : i,
              y: j,
              correct: type === ArithmeticType.DIVISION ? (i * j) / j : i * j
            });
          }
        }
        break;
      case ArithmeticType.ADDITION:
      case ArithmeticType.SUBTRACTION:
        for (i=100; i>=0; i--) {
          for (j=i; j>=0; j--) {
            questions.push({
              x: type === ArithmeticType.ADDITION ? i - j : i,
              y: j,
              correct: type === ArithmeticType.ADDITION ? i : i - j
            });
          }
        }
        break;
    }
    // Let's shuffle
    questions = H5P.shuffleArray(questions);

    if (questions.length > maxQuestions) {
      questions = questions.slice(0, maxQuestions);
    }

    // Create alternatives
    for (i = 0; i < questions.length; i++) {
      generateAlternatives(questions[i]);
      questions[i].textual = createTextualQuestion(questions[i]);
    }

    /**
     * Returns the questions including alternatives and textual representation
     * @public
     * @return {array}
     */
    self.get = function () {
      return questions;
    };
    
  }

  ArithmeticGenerator.prototype.readableQuestion = function (translations, readableSigns, question) {
    return translations.humanizedQuestion
      .replace(':arithmetic', readableSigns);
  };

  ArithmeticGenerator.prototype.readableText = function (question) {
    return question.textual + ' = ?';    
  };
    
  return ArithmeticGenerator;
}(H5P.ArithmeticQuiz.ArithmeticType));
;
/**
 * Defines the H5P.ArithmeticQuiz.GamePage class
 */
H5P.ArithmeticQuiz.GamePage = (function ($, UI, QuizType) {

  /**
   * Creates a new GamePage instance
   *
   * @class
   * @augments H5P.EventDispatcher
   * @namespace H5P
   * @param  {quizType} quizType
   * @param  {Object} t Object containing all options
   * @param {number} id Unique id to identify this quiz
   * @fires H5P.XAPIEvent
   */
  function GamePage(quizType, options, id) {
    H5P.EventDispatcher.call(this);
    var self = this;
    self.quizType = quizType;
    self.id = id;
    self.translations = options.UI;
    self.arithmeticType = options.arithmeticType;
    self.equationType = options.equationType;
    self.useFractions = options.useFractions;
    self.maxQuestions = options.maxQuestions;
    self.sliding = false;

    self.$gamepage = $('<div>', {
      'class': 'h5p-baq-game counting-down'
    });

    if (self.quizType === H5P.ArithmeticQuiz.QuizType.ARITHMETIC) {
      self.questionsGenerator = new H5P.ArithmeticQuiz.ArithmeticGenerator(self.arithmeticType, self.maxQuestions);
    } else {
      self.questionsGenerator = new H5P.ArithmeticQuiz.EquationsGenerator(self.arithmeticType, self.equationType, self.maxQuestions, self.useFractions);
    }
    self.score = 0;
    self.scoreWidget = new ScoreWidget(self.translations);
    self.scoreWidget.appendTo(self.$gamepage);

    self.timer = new H5P.ArithmeticQuiz.TimerWidget(self.translations);
    self.timer.appendTo(self.$gamepage);

    self.slider = UI.createSlider();

    self.countdownWidget = new H5P.ArithmeticQuiz.CountdownWidget(4, self.translations);
    self.slider.addSlide(self.countdownWidget.create());
    self.countdownWidget.on('ignition', function () {
      self.$gamepage.removeClass('counting-down');
      self.progressbar.setProgress(0);
      self.slider.next();
      self.timer.start();
      self.trigger('started-quiz');
    });

    // Shuffle quizzes:
    self.quizzes = self.questionsGenerator.get();

    var numQuestions = self.quizzes.length;
    for (var i = 0; i < numQuestions; i++) {
      self.slider.addSlide(self.createSlide(self.quizzes[i], i));
    }

    // Create progressbar
    self.progressbar = UI.createProgressbar(numQuestions, {
      progressText: self.translations.slideOfTotal
    });
    self.progressbar.appendTo(self.$gamepage);

    // Add result page:
    self.resultPage = new H5P.ArithmeticQuiz.ResultPage(numQuestions, self.translations);
    self.slider.addSlide(self.resultPage.create());

    self.resultPage.on('retry', function () {
      self.reset();
      self.slider.first();
    });

    self.slider.on('last-slide', function () {
      self.resultPage.update(self.score, self.timer.pause());
      self.$gamepage.addClass('result-page');
      self.trigger('last-slide', {
        score: self.score,
        numQuestions: numQuestions
      });
    });

    self.slider.on('first-slide', function () {
      self.$gamepage.removeClass('result-page');
    });

    self.slider.on('move', function () {
      self.progressbar.next();
    });

    self.slider.on('moved', function () {
      self.sliding = false;
      // Set focus
      var $button = self.$gamepage.find('.current .h5p-joubelui-button')[0];
      if ($button) {
        $button.focus();
      }
    });

    self.slider.attach(self.$gamepage);
  }
  GamePage.prototype = Object.create(H5P.EventDispatcher.prototype);
  GamePage.prototype.constructor = GamePage;

  /**
   * Starts the countdown
   */
  GamePage.prototype.startCountdown = function () {
    this.countdownWidget.start();
  };

  /**
   * Calculate maximum height
   * @method getMaxHeight
   * @return {number}
   */
  GamePage.prototype.getMaxHeight = function () {
    var $slide = $('.question-page', this.$gamepage).first();
    $slide.css({
      display: 'block',
      width: $('.h5p-container').width() + 'px'
    });
    var height = $slide.height();
    $slide.css({
      display: '',
      width: '100%'
    });

    return height;
  };

  /**
   * Resets quiz
   */
  GamePage.prototype.reset = function () {
    this.score = 0;
    this.scoreWidget.update(0);
    this.timer.reset();
    this.$gamepage.find('.reveal-wrong').removeClass('reveal-wrong');
    this.$gamepage.find('.reveal-correct').removeClass('reveal-correct');
    this.$gamepage.find('.h5p-baq-alternatives .h5p-joubelui-button')
      .attr('aria-checked', 'false');
    this.$gamepage.addClass('counting-down');
    this.countdownWidget.restart();
    this.$gamepage.find('.h5p-joubelui-button:first-child, .h5p-joubelui-button:last-child').attr('tabindex', 0);
  };

  GamePage.prototype.makeSignsReadable = function (questionTextual) {
    var self = this;
    questionTextual = String(questionTextual);
    return questionTextual
        .replaceAll('\\+', self.translations.plusOperator)
        .replaceAll('−', self.translations.minusOperator)
        .replaceAll('-', self.translations.minusOperator)
        .replaceAll('×', self.translations.multiplicationOperator)
        .replaceAll('/', ' ' + self.translations.divisionOperator + ' ')
        .replaceAll('÷', self.translations.divisionOperator)
        .replaceAll('=', self.translations.equalitySign);
  };

  /**
   * Creates a question slide
   *
   * @param  {Object} question
   * @param  {string} question.q The question
   * @param  {number} question.correct The correct answer
   * @param  {number} i Index of question
   * @return {H5P.jQuery} The jquery dom element generated
   */
  GamePage.prototype.createSlide = function (question, i) {
    var self = this;
    var readableSigns = undefined;
    var readableQuestion = undefined;
    var readableText = undefined;
    var $slide = $('<div>', {
      'class': 'question-page'
    });

    // Make equations readable, e.g. plus signs are not read by ChromeVox.
    readableSigns = self.makeSignsReadable(question.textual);
    readableQuestion = self.questionsGenerator.readableQuestion(self.translations, readableSigns, question);
    readableText = self.questionsGenerator.readableText(question);

    var questionId = 'arithmetic-quiz-' + self.id + '-question-' + i;

    $('<div>', {
      'class': 'question',
      'text': readableText,
      'aria-label': readableQuestion,
      'id': questionId
    }).appendTo($slide);

    if (question.expression !== undefined) {
      var readableVariable = self.translations.humanizedVariable
          .replace(':item', question.variable);
      $('<div>', {
        'class': 'question',
        'text': question.variable + ' = ?',
        'aria-label': readableVariable,
        'id': questionId
      }).appendTo($slide);
    }

    var $alternatives = $('<ul>', {
      'class': 'h5p-baq-alternatives',
      'role': 'radiogroup',
      'aria-labelledby': questionId
    });

    // Index of the currently focused option.
    var focusedOption;

    /**
     * Handles focusing one of the options, making the rest non-tabbable.
     * @private
     */
    var handleFocus = function () {
      // Go through all alternatives
      for (var i = 0; i < alternatives.length; i++) {
        if (alternatives[i] === this) {
          // Keep track of currently focused option
          focusedOption = i;
          alternatives[i].tabbable();
        }
        else {
          // Remove from tab
          alternatives[i].notTabbable();
        }
      }
    };

    /**
     * Handles moving the focus from the current option to the previous option.
     * @private
     */
    var handlePreviousOption = function () {
      if (focusedOption !== 0) {
        alternatives[focusedOption - 1].focus();
      }
    };

    /**
     * Handles moving the focus from the current option to the next option.
     * @private
     */
    var handleNextOption = function () {
      if (focusedOption !== alternatives.length - 1) {
        alternatives[focusedOption + 1].focus();
      }
    };

    var alternatives = [];
    var readableAlternative = undefined;
    for (var k = 0; k < question.alternatives.length; k++) {
      readableAlternative = self.makeSignsReadable(question.alternatives[k]);
      alternatives.push(new Alternative(question.alternatives[k], readableAlternative, question.alternatives[k]===question.correct, self.translations));
    }

    alternatives.forEach(function (alternative, index) {
      if (index === 0 || index === alternatives.length - 1) {
        alternative.tabbable();
      }
      alternative.on('focus', handleFocus);
      alternative.on('previousOption', handlePreviousOption);
      alternative.on('nextOption', handleNextOption);
      alternative.appendTo($alternatives);
      alternative.on('answered', function () {

        // Ignore clicks if in the middle of something else:
        if (self.sliding) {
          return;
        }
        self.sliding = true;

        self.trigger('alternative-chosen');

        // Can't play it after the transition end is received, since this is not
        // accepted on iPad. Therefore we are playing it here with a delay instead
        H5P.ArithmeticQuiz.SoundEffects.play(alternative.correct ? 'positive-short' : 'negative-short', 300);

        if (alternative.correct) {
          self.score++;
          self.scoreWidget.update(self.score);
        }

        alternatives.forEach(function (alt) {
          if (alt.correct && alternative !== alt) {
            alternative.announce(self.translations.incorrectText.replace(':num', alt.readableResult));
          }
          alt.reveal();
        });

        setTimeout(function(){
          self.slider.next();
        }, 3500);
      });
    });

    $alternatives.appendTo($slide);
    return $slide;
  };


  /**
   * Append game page to container
   *
   * @param  {H5P.jQuery} $container
   */
  GamePage.prototype.appendTo = function ($container) {
    this.$gamepage.appendTo($container);
  };

  String.prototype.replaceAll = function(target, replacement) {
      //var target = this;
      return this.split(target).join(replacement);
      //return target.replace(new RegExp(search, 'g'), replacement);
  };

  /**
   * Creates a ScoreWidget instance
   *
   * @class
   * @private
   * @param  {Object} t Translation object
   */
  function ScoreWidget(t) {
    var self = this;

    var $score = $('<span>', {
      'class': 'h5p-baq-score-widget-number',
      html: 0
    });

    this.$scoreWidget = $('<div>', {
      'class': 'h5p-baq-score-widget',
      'aria-live': 'polite',
      'aria-atomic': true,
      html: t.score + ' '
    }).append($score);

    this.scoreElement = $score.get(0);

    this.appendTo = function ($container) {
      this.$scoreWidget.appendTo($container);

      new Odometer({
        el: this.scoreElement
      });
    };

    this.update = function (score) {
      // Need this aria-busy to make sure readspeaker is not reading
      // both old and new score
      this.$scoreWidget.attr('aria-busy', true);
      this.scoreElement.innerHTML = score;
      // timeout has to be long enough that odometer has time to transition
      setTimeout(function () {
        self.$scoreWidget.attr('aria-busy', false);
      }, 500);
    };
  }


  /**
   * Creates an Alternative button instance
   *
   * @class
   * @private
   * @augments H5P.EventDispatcher
   * @fires H5P.Event
   * @param {number} number Number on button
   * @param {boolean} correct Correct or not
   * @param {Object} t Translations
   */
  function Alternative(number, readableResult, correct, t) {
    H5P.EventDispatcher.call(this);
    var self = this;

    self.number = number;
    self.readableResult = readableResult;
    self.correct = correct;

    var answer = function (event) {
      if (self.correct) {
        self.announce(t.correctText);
      }
      self.$button.attr('aria-checked', 'true');
      self.trigger('answered');
      setTimeout(self.dropLive, 500);
      event.preventDefault();
    };

    // Create radio button and set up event listeners
    this.$button = $('<li>', {
      'class': 'h5p-joubelui-button',
      'role': 'radio',
      'tabindex': -1,
      'text': number,
      'aria-checked': 'false',
      'on': {
        'keydown': function (event) {
          if (self.$button.is('.reveal-correct, .reveal-wrong')) {
            return;
          }
          switch (event.which) {
            case 13: // Enter
            case 32: // Space
              // Answer question
              answer(event);
              break;

            case 37: // Left Arrow
            case 38: // Up Arrow
              // Go to previous Option
              self.trigger('previousOption');
              event.preventDefault();
              break;

            case 39: // Right Arrow
            case 40: // Down Arrow
              // Go to next Option
              self.trigger('nextOption');
              event.preventDefault();
              break;
          }
        },
        'focus': function () {
          if (self.$button.is('.reveal-correct, reveal-wrong')) {
            return;
          }
          self.trigger('focus');
        },
        'click': function (event) {
          if (self.$button.is('.reveal-correct, reveal-wrong')) {
            return;
          }
          // Answer question
          answer(event);
        }
      }
    });

    /**
     * Move focus to this option.
     */
    self.focus = function () {
      self.$button.focus();
    };

    /**
     * Makes it possible to tab your way to this option.
     */
    self.tabbable = function () {
      self.$button.attr('tabindex', 0);
    };

    /**
     * Make sure it's NOT possible to tab your way to this option.
     */
    self.notTabbable = function () {
      self.$button.attr('tabindex', -1);
    };

    this.dropLive = function() {
      if (self.$liveRegion) {
        var node = self.$liveRegion[0];
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    };

    this.announce = function (text) {
      self.$liveRegion = $('<div>', {
        'class': 'h5p-baq-live-feedback',
        'aria-live': 'assertive',
        'width': '1px',
        'height': '1px',
      }).appendTo(document.body.lastChild);

      // Readspeaker needs a small delay after creating the aria live field
      // in order to pick up the change
      setTimeout(function () {
        self.$liveRegion.text(text);
      }, 100);
    };


    this.reveal = function () {
      this.$button.addClass(this.correct ? 'reveal-correct' : 'reveal-wrong')
          .attr('tabindex', -1);
    };

    this.appendTo = function ($container) {
      this.$button.appendTo($container);
      return this;
    };
  }
  Alternative.prototype = Object.create(H5P.EventDispatcher.prototype);
  Alternative.prototype.constructor = Alternative;

  return GamePage;
})(H5P.jQuery, H5P.JoubelUI, H5P.ArithmeticQuiz.QuizType);
;
H5P.ArithmeticQuiz.ResultPage = (function ($, UI) {
  /**
   * Creates a ResultPage instance
   *
   * @class
   * @namespace H5P.ArithmeticQuiz
   * @augments H5P.EventDispatcher
   *
   * @param  {number} maxScore Max score
   * @param  {Object} t Translation objects
   * @fires H5P.Event
   */
  function ResultPage(maxScore, t){
    H5P.EventDispatcher.call(this);
    var self = this;

    this.$resultPage = $('<div>', {
      'class': 'h5p-baq-result-page'
    });

    this.$feedbackContainer = $('<div>', {
      'class': 'h5p-baq-result-page-feedback'
    }).appendTo(this.$resultPage);

    this.$scoreStatus = $('<div>', {
      'class': 'h5p-baq-result-page-score-status',
      'aria-live': 'assertive'
    }).appendTo(this.$feedbackContainer);

    this.$scoreStatus.append($('<div>', {
      'class': 'h5p-baq-result-page-header',
      'html': t.resultPageHeader
    }));

    this.maxScore = maxScore;
    this.scoreBar = UI.createScoreBar(maxScore);
    this.scoreBar.appendTo(this.$scoreStatus);

    this.$ariaScoreBar = $('<div>', {
      'class': 'hidden-but-read',
      appendTo: this.$scoreStatus,
    });

    this.$time = $('<div>', {
      'class': 'h5p-baq-result-page-time',
      'aria-hidden': true,
    }).appendTo(this.$scoreStatus);

    /**
     * Note: We need a separate assistive technology field for time because
     * some readers are not able to interpret the duration format of <time>
     */
    this.$ariaTime = $('<div>', {
      'class': 'hidden-but-read',
    }).appendTo(this.$scoreStatus);

    UI.createButton({
      text: t.retryButton,
      'class': 'mq-control-button',
      click: function () {
        self.trigger('retry');
        self.update(0, '00:00');
        self.scoreBar.reset();
      }
    }).appendTo(this.$feedbackContainer);

    this.$resultAnnouncer = $('<div>', {
      'class': 'h5p-baq-live-feedback',
      'aria-live': 'assertive',
    }).appendTo(this.$resultPage);

    /**
     * Creates result page
     *
     * @return {H5P.jQuery}
     */
    this.create = function () {
      return this.$resultPage;
    };

    /**
     * Get score as a string
     * @param {Number} score Current score
     * @return {String} Score string
     */
    this.getReadableScore = function (score) {
      return t.score + ' ' + score + '/' + this.maxScore;
    };

    /**
     * Get readable time
     * @param {String} time Current time in the format: "minutes:seconds"
     * @returns {*|void|string|null}
     */
    this.getReadableTime = function (time) {
      return t.time.replace('@time', time.replace(':', ', '));
    };

    /**
     * Announce result page info
     * @param {Number} score Current score
     * @param {String} time Current time in the format: "minutes:seconds"
     */
    this.announce = function (score, time) {
      let text = t.resultPageHeader + ' ';
      text +=  this.getReadableScore(score) + '. ';
      text += this.getReadableTime(time);

      // Readspeaker needs a small delay after creating the aria live field
      // in order to pick up the change
      setTimeout(function () {
        self.$resultAnnouncer.text(text);
      }, 100);
    };

    /**
     * Updates result page
     *
     * @param  {number} score
     * @param  {string} time
     */
    this.update = function (score, time) {
      let minutes = parseInt(time.split(':')[0], 10);
      let seconds = parseInt(time.split(':')[1], 10);
      const dateTime = 'PT' + minutes + 'M' + seconds + 'S';
      const timeHtml = '<time datetime="' + dateTime + '">' + time + '</time>';
      this.$time.html(H5P.ArithmeticQuiz.tReplace(t.time, {time: timeHtml}));
      this.$ariaTime.html(this.getReadableTime(time));
      this.scoreBar.setScore(score);
      this.$ariaScoreBar.text(this.getReadableScore(score));

      this.announce(score, time);
    };
  }
  ResultPage.prototype = Object.create(H5P.EventDispatcher.prototype);
  ResultPage.prototype.constructor = ResultPage;

  return ResultPage;

})(H5P.jQuery, H5P.JoubelUI);
;
/*! For license information please see odometer.min.js.LICENSE.txt */
(function(){var t,e,n,i,o,r,s,a,u,d,l,h,p,c,m,f,g,v,w,M,y=[].slice;t=/^\(?([^)]*)\)?(?:(.)(d+))?$/,e=1e3/30,p=document.createElement("div").style,o=null!=p.transition||null!=p.webkitTransition||null!=p.mozTransition||null!=p.oTransition,l=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame,n=window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver,s=function(t){var e;return(e=document.createElement("div")).innerHTML=t,e.children[0]},d=function(t,e){return t.className=t.className.replace(new RegExp("(^| )"+e.split(" ").join("|")+"( |$)","gi")," ")},r=function(t,e){return d(t,e),t.className+=" "+e},c=function(t,e){var n;return null!=document.createEvent?((n=document.createEvent("HTMLEvents")).initEvent(e,!0,!0),t.dispatchEvent(n)):void 0},u=function(){var t,e;return null!=(t=null!=(e=window.performance)&&"function"==typeof e.now?e.now():void 0)?t:+new Date},h=function(t,e){return null==e&&(e=0),e?(t*=Math.pow(10,e),t+=.5,t=Math.floor(t),t/=Math.pow(10,e)):Math.round(t)},m=function(t){return 0>t?Math.ceil(t):Math.floor(t)},a=function(t){return t-h(t)},g=!1,(f=function(){var t,e,n,i,o;if(!g&&null!=window.jQuery){for(g=!0,o=[],e=0,n=(i=["html","text"]).length;n>e;e++)t=i[e],o.push(function(t){var e;return e=window.jQuery.fn[t],window.jQuery.fn[t]=function(t){var n;return null==t||null==(null!=(n=this[0])?n.odometer:void 0)?e.apply(this,arguments):this[0].odometer.update(t)}}(t));return o}})(),setTimeout(f,0),i=function(){function i(t){var n,o,r,s,a,u,d,l,h,p=this;if(this.options=t,this.el=this.options.el,null!=this.el.odometer)return this.el.odometer;for(n in this.el.odometer=this,d=i.options)r=d[n],null==this.options[n]&&(this.options[n]=r);null==(s=this.options).duration&&(s.duration=2e3),this.MAX_VALUES=this.options.duration/e/2|0,this.resetFormat(),this.value=this.cleanValue(null!=(l=this.options.value)?l:""),this.renderInside(),this.render();try{for(a=0,u=(h=["innerHTML","innerText","textContent"]).length;u>a;a++)o=h[a],null!=this.el[o]&&function(t){Object.defineProperty(p.el,t,{get:function(){var e;return"innerHTML"===t?p.inside.outerHTML:null!=(e=p.inside.innerText)?e:p.inside.textContent},set:function(t){return p.update(t)}})}(o)}catch(t){this.watchForMutations()}}return i.prototype.renderInside=function(){return this.inside=document.createElement("div"),this.inside.className="odometer-inside",this.el.innerHTML="",this.el.appendChild(this.inside)},i.prototype.watchForMutations=function(){var t=this;if(null!=n)try{return null==this.observer&&(this.observer=new n((function(e){var n;return n=t.el.innerText,t.renderInside(),t.render(t.value),t.update(n)}))),this.watchMutations=!0,this.startWatchingMutations()}catch(t){}},i.prototype.startWatchingMutations=function(){return this.watchMutations?this.observer.observe(this.el,{childList:!0}):void 0},i.prototype.stopWatchingMutations=function(){var t;return null!=(t=this.observer)?t.disconnect():void 0},i.prototype.cleanValue=function(t){var e;return"string"==typeof t&&(t=(t=(t=t.replace(null!=(e=this.format.radix)?e:".","<radix>")).replace(/[.,]/g,"")).replace("<radix>","."),t=parseFloat(t,10)||0),h(t,this.format.precision)},i.prototype.bindTransitionEnd=function(){var t,e,n,i,o,r,s=this;if(!this.transitionEndBound){for(this.transitionEndBound=!0,e=!1,r=[],n=0,i=(o="transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd".split(" ")).length;i>n;n++)t=o[n],r.push(this.el.addEventListener(t,(function(){return e||(e=!0,setTimeout((function(){return s.render(),e=!1,c(s.el,"odometerdone")}),0)),!0}),!1));return r}},i.prototype.resetFormat=function(){var e,n,i,o,r,s,a,u;if((e=null!=(a=this.options.format)?a:"(,ddd).dd")||(e="d"),!(i=t.exec(e)))throw new Error("Odometer: Unparsable digit format");return s=(u=i.slice(1,4))[0],r=u[1],o=(null!=(n=u[2])?n.length:void 0)||0,this.format={repeating:s,radix:r,precision:o}},i.prototype.render=function(t){var e,n,i,r,s,a,u;for(null==t&&(t=this.value),this.stopWatchingMutations(),this.resetFormat(),this.inside.innerHTML="",s=this.options.theme,r=[],a=0,u=(e=this.el.className.split(" ")).length;u>a;a++)(n=e[a]).length&&((i=/^odometer-theme-(.+)$/.exec(n))?s=i[1]:/^odometer(-|$)/.test(n)||r.push(n));return r.push("odometer"),o||r.push("odometer-no-transitions"),s?r.push("odometer-theme-"+s):r.push("odometer-auto-theme"),this.el.className=r.join(" "),this.ribbons={},this.formatDigits(t),this.startWatchingMutations()},i.prototype.formatDigits=function(t){var e,n,i,o,r,s,u,d,l;if(this.digits=[],this.options.formatFunction)for(o=0,s=(d=this.options.formatFunction(t).split("").reverse()).length;s>o;o++)(n=d[o]).match(/0-9/)?((e=this.renderDigit()).querySelector(".odometer-value").innerHTML=n,this.digits.push(e),this.insertDigit(e)):this.addSpacer(n);else for(i=!this.format.precision||!a(t)||!1,r=0,u=(l=t.toString().split("").reverse()).length;u>r;r++)"."===(e=l[r])&&(i=!0),this.addDigit(e,i)},i.prototype.update=function(t){var e,n=this;return(e=(t=this.cleanValue(t))-this.value)?(d(this.el,"odometer-animating-up odometer-animating-down odometer-animating"),r(this.el,e>0?"odometer-animating-up":"odometer-animating-down"),this.stopWatchingMutations(),this.animate(t),this.startWatchingMutations(),setTimeout((function(){return n.el.offsetHeight,r(n.el,"odometer-animating")}),0),this.value=t):void 0},i.prototype.renderDigit=function(){return s('<span class="odometer-digit"><span class="odometer-digit-spacer">8</span><span class="odometer-digit-inner"><span class="odometer-ribbon"><span class="odometer-ribbon-inner"><span class="odometer-value"></span></span></span></span></span>')},i.prototype.insertDigit=function(t,e){return null!=e?this.inside.insertBefore(t,e):this.inside.children.length?this.inside.insertBefore(t,this.inside.children[0]):this.inside.appendChild(t)},i.prototype.addSpacer=function(t,e,n){var i;return(i=s('<span class="odometer-formatting-mark"></span>')).innerHTML=t,n&&r(i,n),this.insertDigit(i,e)},i.prototype.addDigit=function(t,e){var n,i,o,r;if(null==e&&(e=!0),"-"===t)return this.addSpacer(t,null,"odometer-negation-mark");if("."===t)return this.addSpacer(null!=(r=this.format.radix)?r:".",null,"odometer-radix-mark");if(e)for(o=!1;;){if(!this.format.repeating.length){if(o)throw new Error("Bad odometer format without digits");this.resetFormat(),o=!0}if(n=this.format.repeating[this.format.repeating.length-1],this.format.repeating=this.format.repeating.substring(0,this.format.repeating.length-1),"d"===n)break;this.addSpacer(n)}return(i=this.renderDigit()).querySelector(".odometer-value").innerHTML=t,this.digits.push(i),this.insertDigit(i)},i.prototype.animate=function(t){return o&&"count"!==this.options.animation?this.animateSlide(t):this.animateCount(t)},i.prototype.animateCount=function(t){var e,n,i,o,r,s=this;if(n=+t-this.value)return o=i=u(),e=this.value,(r=function(){var a,d;return u()-o>s.options.duration?(s.value=t,s.render(),void c(s.el,"odometerdone")):((a=u()-i)>50&&(i=u(),d=a/s.options.duration,e+=n*d,s.render(Math.round(e))),null!=l?l(r):setTimeout(r,50))})()},i.prototype.getDigitCount=function(){var t,e,n,i,o,r;for(t=o=0,r=(i=1<=arguments.length?y.call(arguments,0):[]).length;r>o;t=++o)n=i[t],i[t]=Math.abs(n);return e=Math.max.apply(Math,i),Math.ceil(Math.log(e+1)/Math.log(10))},i.prototype.getFractionalDigitCount=function(){var t,e,n,i,o,r,s;for(e=/^\-?\d*\.(\d*?)0*$/,t=r=0,s=(o=1<=arguments.length?y.call(arguments,0):[]).length;s>r;t=++r)i=o[t],o[t]=i.toString(),n=e.exec(o[t]),o[t]=null==n?0:n[1].length;return Math.max.apply(Math,o)},i.prototype.resetDigits=function(){return this.digits=[],this.ribbons=[],this.inside.innerHTML="",this.resetFormat()},i.prototype.animateSlide=function(t){var e,n,i,o,s,a,u,d,l,h,p,c,f,g,v,w,M,y,b,T,E,x,S,D,L,F,A;if(w=this.value,(d=this.getFractionalDigitCount(w,t))&&(t*=Math.pow(10,d),w*=Math.pow(10,d)),i=t-w){for(this.bindTransitionEnd(),o=this.getDigitCount(w,t),s=[],e=0,p=b=0;o>=0?o>b:b>o;p=o>=0?++b:--b){if(M=m(w/Math.pow(10,o-p-1)),a=(u=m(t/Math.pow(10,o-p-1)))-M,Math.abs(a)>this.MAX_VALUES){for(h=[],c=a/(this.MAX_VALUES+this.MAX_VALUES*e*.5),n=M;a>0&&u>n||0>a&&n>u;)h.push(Math.round(n)),n+=c;h[h.length-1]!==u&&h.push(u),e++}else h=function(){A=[];for(var t=M;u>=M?u>=t:t>=u;u>=M?t++:t--)A.push(t);return A}.apply(this);for(p=T=0,x=h.length;x>T;p=++T)l=h[p],h[p]=Math.abs(l%10);s.push(h)}for(this.resetDigits(),p=E=0,S=(F=s.reverse()).length;S>E;p=++E)for(h=F[p],this.digits[p]||this.addDigit(" ",p>=d),null==(y=this.ribbons)[p]&&(y[p]=this.digits[p].querySelector(".odometer-ribbon-inner")),this.ribbons[p].innerHTML="",0>i&&(h=h.reverse()),f=L=0,D=h.length;D>L;f=++L)l=h[f],(v=document.createElement("div")).className="odometer-value",v.innerHTML=l,this.ribbons[p].appendChild(v),f===h.length-1&&r(v,"odometer-last-value"),0===f&&r(v,"odometer-first-value");return 0>M&&this.addDigit("-"),null!=(g=this.inside.querySelector(".odometer-radix-mark"))&&g.parent.removeChild(g),d?this.addSpacer(this.format.radix,this.digits[d-1],"odometer-radix-mark"):void 0}},i}(),i.options=null!=(w=window.odometerOptions)?w:{},setTimeout((function(){var t,e,n,o,r;if(window.odometerOptions){for(t in r=[],o=window.odometerOptions)e=o[t],r.push(null!=(n=i.options)[t]?(n=i.options)[t]:n[t]=e);return r}}),0),i.init=function(){var t,e,n,o,r,s;if(null!=document.querySelectorAll){for(s=[],n=0,o=(e=document.querySelectorAll(i.options.selector||".odometer")).length;o>n;n++)t=e[n],s.push(t.odometer=new i({el:t,value:null!=(r=t.innerText)?r:t.textContent}));return s}},null!=(null!=(M=document.documentElement)?M.doScroll:void 0)&&null!=document.createEventObject?(v=document.onreadystatechange,document.onreadystatechange=function(){return"complete"===document.readyState&&!1!==i.options.auto&&i.init(),null!=v?v.apply(this,arguments):void 0}):document.addEventListener("DOMContentLoaded",(function(){return!1!==i.options.auto?i.init():void 0}),!1),"function"==typeof define&&define.amd?define([],(function(){return i})):"undefined"!=typeof exports&&null!==exports?module.exports=i:window.Odometer=i}).call(this);;
