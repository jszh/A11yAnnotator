$can_enable_dfp = true; $can_enable_dfp_params = {'s': ""};
(function() {
  function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + encodeURIComponent(cvalue) + ";" + expires + ";path=/;secure;";
  };
  setCookie('etf_ced', "true", 0.25);
  setCookie('etf_ced_params', "", 0.25);

  
})();
