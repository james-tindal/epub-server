
for (const item of document.getElementsByClassName('closed'))
  item.addEventListener('click', ({ target }) =>
    target == item
    ? target.className == 'closed'
      ? target.className = 'open'
      : target.className = 'closed'
    : null
  )
