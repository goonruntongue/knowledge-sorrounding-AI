/* Portal order numbers apply only to links explicitly opened from the portal. */
(function(){document.documentElement.classList.toggle("from-portal",new URLSearchParams(window.location.search).get("from")==="portal");})();
