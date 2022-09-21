const pagination = JSON.parse(document.getElementById('pagination').text)
document.addEventListener('keydown', e =>
  !(e.controlKey || e.altKey || e.metaKey || e.shiftKey) &&
  e.key == 'ArrowLeft'  && pagination.previous && (location = pagination.previous) ||
  e.key == 'ArrowRight' && pagination.next     && (location = pagination.next)
)