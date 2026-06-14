(function(Drupal, once) {
  Drupal.behaviors.popoverFallback = {
    attach(context) {
      // Check if there are any popover elements in the DOM.
      const hasPopoverElements =
        once("popoverFallbackCheck", "[popovertarget]", context).length > 0;

      if (hasPopoverElements.length === 0) {
        return;
      }

      // Check if Popover API is supported.
      const popoverSupported = "popover" in HTMLDivElement.prototype;

      once("popoverFallback", "[popovertarget]", context).forEach(button => {
        const popoverId = button.getAttribute("popovertarget");
        const popover = document.getElementById(popoverId);

        if (!popover) {
          return;
        }

        // Check if popover element is inside a <form> parent
        const isInsideForm = popover.closest("form") !== null;

        // If Popover API is supported and popover is not inside form - skip fallback
        if (popoverSupported && !isInsideForm) {
          return;
        }

        // Set initial display style.
        popover.style.display = "none";
        popover.style.position = "fixed";
        popover.style.zIndex = "100";

        const centerPopover = () => {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const popoverWidth = popover.offsetWidth;
          const popoverHeight = popover.offsetHeight;

          const left = (viewportWidth - popoverWidth) / 2;
          const top = (viewportHeight - popoverHeight) / 2;

          popover.style.left = `${left}px`;
          popover.style.top = `${top}px`;
        };

        // Recalculate position on window resize
        window.addEventListener("resize", centerPopover);

        button.addEventListener("click", function(e) {
          e.preventDefault();
          if (popover.style.display === "block") {
            popover.style.display = "none";
          } else {
            popover.style.display = "block";
            centerPopover();
          }
        });
      });

      // Close button logic with fallback
      once(
        "popoverCloseFallback",
        "[popovertargetaction='hide']",
        context
      ).forEach(button => {
        const popoverId = button.getAttribute("popovertarget");
        const popover = document.getElementById(popoverId);

        if (!popover) {
          return;
        }

        button.addEventListener("click", function() {
          popover.style.display = "none";
        });
      });
    }
  };
})(Drupal, once);
