const express = require('express');
const pool = require('./db');
const {v4: uuidv4} = require('uuid')
const bcrypt = require('bcrypt')
const app = express()
const jwt = require('jsonwebtoken')

//wihtout cors..we get 'access to fetch has been blocked by cors policy

//cors middleware is applied before teh route defn '/todos' so that 
//cors middleaware will be applied to all incoming requests that are defiend belwo cors..
//incluidng /todos. this wil allow /todos to be accessed from any domain making cross-orogin request possible
const cors = require('cors');






const PORT = 8000;


app.use(cors());
app.use(express.json())

app.get('/todos/:userEmail', async (req, res)=> {
    const {userEmail} = req.params;
    try {
       const todos = await pool.query('SELECT * FROM todos where user_email = $1', [userEmail])
        res.json(todos.rows)
    }catch(errr) {
        console.error(errr)
    }
})


//creating new todo
app.post('/todos', async (req, res) => {
    const {user_email, title, progress, date} = req.body
    console.log(user_email, title, progress, date)
    const id = uuidv4()
    try {
      const newToDo = await  pool.query (`INSERT INTO todos (id, user_email, title, progress, date)
                     VALUES ($1, $2, $3, $4, $5)`, [id, user_email, title, progress, date])
        res.json(newToDo)
    }catch (err) {
        console.error(err)
    }
})


//edit todo
app.put('/todos/:id', async(req, res)=>{
    const {id}=req.params
    const {user_email, title, progress, date}=req.body
    try {
      const editTodo =  await pool.query('UPDATE todos SET user_email =$1, title=$2, progress = $3, date = $4 WHERE id =$5;', 
      [user_email, title, progress, date, id])

      res.json(editTodo)

    }catch (eerr) {
        console.error(eerr)
    }
})


//delete todo
app.delete('/todos/:id', async(req, res)=> {
    const {id} = req.params
    try {
        const deleteTodo = await pool.query('DELETE FROM todos where id = $1', [id])
        res.json(deleteTodo)

    }catch (eerr) {
        console.log(eerr)
    }
})




//signup
app.post('/signup', async (req, res) => {

  const {email, password} = req.body 
 console.log(email.toString())
  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(password, salt)

    try {
      const signUp =  await pool.query(`INSERT INTO users (email, hashed_password) VALUES ($1, $2)`,
        [email, hashedPassword])

       const token = jwt.sign({email}, 'secret', {expiresIn: '1hr'})
       res.json({email, token})
       //if we try to usue same email again for signup..postgres package import
       //will throw error which we can catch here


       /* When you execute a query using the PostgreSQL driver, it returns a promise that resolves with the query result or rejects with an error object if an error occurs during the query execution. The error object contains information about the error, such as the error message, error code, and additional details.

In your code, when you execute the pool.query function to insert a new user, if an error occurs during the execution of the query (such as a duplicate email error), the promise will be rejected, and the error will be caught in the catch block.*/
    }catch (err) {
        console.error(err)
        if(err) {
            res.json({detail: err.detail})
        }
    }
})

//login

app.post('/login', async (req, res) => {
    const {email, password} = req.body
    console.log(email.toString())
    try {
     const users=  await pool.query('SELECT * FROM users WHERE email = $1', [email])

/*potential value of users (note: email is primary key so always return value is either 1 or 0
    
const users = {
  rowCount: 1, // Number of rows returned
  rows: [
    {
      id: 1,
      email: 'example@example.com',
      hashed_password: 'hashed_password',
      // additional columns...
    },
  ],
};

*/ 

        
     if (!users.rows.length) return res.json({detail:'User does not exist'})

     //else if there is a email then compare the hashed_pw of that property to the
     //password sent by clinent trying to login
    
     const success = await bcrypt.compare(password, users.rows[0].hashed_password)
     const token = jwt.sign({email}, 'secret', {expiresIn: '1hr'})
     if (success) {
        res.json({'email': users.rows[0].email, token})
    }
    //if pw dont match then
    else {
        res.json({detail:'Passwords did not match'})
    }
    }catch (err) {
        console.error(err)
    }
})


//searching for todos

app.post ('/search', async(req, res)=> {
    const {email, searchTerm} = req.body
    console.log(email, searchTerm)
    try {
        const resultTodos = await pool.query(`SELECT * FROM todos WHERE user_email = $1 AND title LIKE '%' || $2 || '%'`,
        [email, searchTerm]
        )
 

        if (resultTodos.rows.length>0)
        {
            console.log(resultTodos.rows)
            res.json(resultTodos.rows)
        }
        else{
             res.json({detail:'No matching queries'})
            console.log('no match')
        }
    }catch(e)
    {
        console.error(e)
    }
})




app.listen (PORT, ()=> console.log(`Server runnon on PORT: ${PORT}`));