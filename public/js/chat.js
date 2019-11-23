const socket = io();
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');//messages playground 

// Templates
const messageTempate = document.querySelector('#message-tamplate').innerHTML;
const locationTemplate = document.querySelector('#location-tamplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });//Parse data from query

//auto scross function
const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild

  //Hight of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHight = $newMessage.offsetHeight + newMessageMargin;

  //Visible height
  const visibleHeight = $messages.offsetHeight;

  //Hight of messages container
  const containerHeight = $messages.scrollHeight;

  //How far have i scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

//Send messages
socket.on('message', (res) => {
  console.log(res);
  const html = Mustache.render(messageTempate, {
    username: res.username,
    res: res.text,
    createdAt: moment(res.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

//Send location
socket.on('locationMessage', (url) => {
  console.log(url);
  const link = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.location,
    createdAt: moment(url.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', link);
  autoscroll();
})


socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  // console.log(room);
  // console.log(users);
  document.querySelector('#sidebar').innerHTML = html;
})


//Message form submit event
$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  //disable 
  let message = $messageFormInput.value;

  socket.emit('clientMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';//Crear input
    $messageFormInput.focus();
    //enable

    if(error) {
      return console.log(error);
    }
    console.log("Message delivered");
  });
})

$sendLocationButton.addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  //disable button
  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {

    let location = `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
    socket.emit('sendLocation', location, (error) => {
      if(error) {
        return console.log(error);
      }
      //anable button
      $sendLocationButton.removeAttribute('disabled');
      
      console.log('Location delivered');
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if(error) {
    alert(error);
    location.href = '/'
  }
})