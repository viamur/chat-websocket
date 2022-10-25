const express = require('express');
const path = require('path');

const app = express();
const publicPath = path.join(__dirname, 'public');

const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(publicPath));

app.get('/chat', (req, res) => {
  res.send('<h1>Chat</h1>');
});

/* Массив с онлайн пользователями */
let usersChat = [];

io.on('connection', socket => {
  /* Вытягиваем id пользователя который подкл по нашему сокету */
  const { id } = socket;
  /* Добовляем его в массив пользователей онлайн */
  usersChat.push(id);
  console.log('User connected!');
  /* Когда каждый пользователь подсоед то
  Выполняет отправка ВСЕМ пользователям новый список польз онлайн */
  io.emit('chat_online', { usersChat });

  /* Слушаем от КЛИЕНТА сообщение с названием  "CHAT_MESSAGE" */
  socket.on('CHAT_MESSAGE', ({ message }) => {
    /* Ищем в строке значек @ если есть то значит это приватное сообщение */
    const privat = message.includes('@');
    if (privat) {
      /* Вытягиваем с сообщение наше ID */
      const oneArr = message.split(' ')[0];
      const idPrivat = oneArr.slice(1, oneArr.length);

      /* Отправляем приватное сообщение пользователю по ID */
      io.to(idPrivat).emit('CHAT_UPDATE', {
        message: `Приватное сообщение: ${message}`,
      });
      return;
    }

    /* ЕСЛИ НЕ ПРИВАТНОЕ то просто всем отсылаем сообщение */
    io.emit('CHAT_UPDATE', { message });
  });

  /* Происходит когда пользователь отключ от сервера */
  socket.on('disconnect', () => {
    console.log('User disconnect!');
    /* Убираем ID пользователя из массива */
    usersChat = usersChat.filter(el => el !== id);
    /* И отправляем всем пользователям новый список онлайн пользователей */
    io.emit('chat_online', { usersChat });
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
