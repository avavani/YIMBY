//this function would update a message on the dashboard on

//updating message
function updateMessage(feature) {
  const messageEl = document.getElementById('message');

  if (!feature || !feature.length) {
    messageEl.textContent = 'No multifamily units data available';
    return;
  }

  const unitCount = feature.length.toLocaleString();
  messageEl.textContent = `${unitCount} New Multifamily Units Built`;
}

export { updateMessage };
