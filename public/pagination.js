const pagination = JSON.parse(document.getElementById('pagination').text)
addEventListener('keydown', e =>
  e.metaKey && !(e.controlKey || e.altKey || e.shiftKey) &&
    e.key == 'ArrowUp' && (location = '/') ||
  !(e.controlKey || e.altKey || e.metaKey || e.shiftKey) &&
    e.key == 'ArrowLeft'  && pagination.previous && (location = pagination.previous) ||
    e.key == 'ArrowRight' && pagination.next     && (location = pagination.next)
)
