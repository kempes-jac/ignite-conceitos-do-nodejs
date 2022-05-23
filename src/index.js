const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];


function checksExistsUserAccount(request, response, next) {
  //Get username from request.headers
  const { username } = request.headers;
  //Get user from users list
  const user = users.find( user => user.username == username );
  //Check if user exists
  if(!user){
    return response.status(404).json({error: 'Mensagem do erro'})
  }

  //If the user exists, its data is added to request (it may be uses later)
  request.user = user;
  //Next function call
  return next();
}


/**
 * Check if task exist, trying to find it inside user todos list, using id
 * sent via request params
 * @param {*} request HTTP request
 * @param {*} response HTTP response
 * @param {*} next Next function call in chain
 * @returns An error message, if task does not exist, or next function call
 */
 const checkExistsTask = (request, response, next ) => {
  const { user } = request;
  const { id } = request.params;

  //Task retrieval
  const task  = user.todos.find( todo => todo.id === id );

  //Task validation
  if(!task){
    return response.status(404).json({error: 'Mensagem do erro'})
  }

  request.task = task;

  return next();

};



app.post('/users', (request, response) => {
  const user = request.body;

  //Check if users already exists
  const userAlreadyExists = users.some( oldUser => 
    oldUser.username === user.username );

  //If the sent users already exists, a error is returned
  if(userAlreadyExists){
    return response.status(400).json({error: 'Mensagem do erro'})
  }

  //If user does not exists, a new one is created using a new UUID and
  //an empty todo list
  const newUser = {
    id: uuidv4(),
    name: user.name,
    username: user.username,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  //Task data comes inside request body as a JSON content.
  const { title, deadline } = request.body;

  //A new task is created using a new UUID and current date and time
  const newTodo = {
    id: uuidv4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  user.todos.push(newTodo);
  //After created, a 200 status is returned
  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTask, (request, response) => {
  //New data sent via request body
  const { title, deadline } = request.body;
  
  const { task } = request;

  //New title validation
  if(title){
    task.title = title;
  }

  //New deadline validation
  if(deadline){
    const newDeadLine = new Date(deadline);
    if(newDeadLine != "Invalid Date"){
      task.deadline = newDeadLine;
    }else{
      return response.status(400).json({error:"Invalid date"})
    }
  }

  //OK response
  return response.status(200).json(task);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTask, (request, response) => {
  const { task } = request;

  task.done = true;

  return response.status(200).json(task);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTask, (request, response) => {
  const { user } = request;
  const { task } = request;

  user.todos.splice(user.todos.indexOf(task),1);

  return response.status(204).send();
});

module.exports = app;