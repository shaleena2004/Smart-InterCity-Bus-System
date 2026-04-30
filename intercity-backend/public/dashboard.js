const passengerListElement = document.getElementById('passenger-list');

const renderPassengers = (passengers) => {
  if (!passengerListElement) return;
  if (!passengers?.length) {
    passengerListElement.innerHTML = '<p>No passengers found yet.</p>';
    return;
  }

  passengerListElement.innerHTML = passengers
    .map((passenger) => {
      const contacts = (passenger.emergencyContacts || [])
        .map((contact) => `<div class="passenger-contact"><strong>${contact.name}</strong> (${contact.relationship}) - ${contact.phone}</div>`)
        .join('');

      return `
        <article class="passenger-card">
          <h3>${passenger.name || 'Passenger'}</h3>
          <p><strong>Phone:</strong> ${passenger.phone}</p>
          <p><strong>Email:</strong> ${passenger.email || 'Not provided'}</p>
          <p><strong>Role:</strong> ${passenger.role || 'passenger'}</p>
          <div>${contacts || '<p>No emergency contact saved.</p>'}</div>
        </article>
      `;
    })
    .join('');
};

const loadPassengers = async () => {
  if (!passengerListElement) return;
  try {
    const response = await fetch('/passengers');
    const data = await response.json();
    if (response.ok) {
      renderPassengers(data.passengers || []);
    } else {
      passengerListElement.innerHTML = `<p>Unable to load passengers: ${data.message || 'Server error'}</p>`;
    }
  } catch (error) {
    passengerListElement.innerHTML = '<p>Unable to connect to server.</p>';
  }
};

loadPassengers();
