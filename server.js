const { RSA_NO_PADDING } = require('constants');
const express = require('express');
const { get } = require('http');
const path = require('path');
const fs = require('fs');
var movies = require('./movies.json');
var people = require('./people.json');
const { moveMessagePortToContext } = require('worker_threads');
const movieFilePath = path.join(__dirname, 'movies.json');
const peopleFilePath = path.join(__dirname, 'people.json');
const app= express();
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.set("view engine","pug"); 
const session = require('express-session');
const { nextTick, exit } = require('process');
const { stringify } = require('querystring');
app.use(session({
  cookie: {
    maxAge: 500000000000000000000
  },
  secret: 'Im batman'
}));
app.get("/",getLogin);
app.get("/login",getLogin);
app.post("/login",postLogin);
app.get("/movies",parseQueryMovies,getFilms);
app.get("/createUser",getCreateUser);
app.post("/createUser",getCreateUser);
app.get("/logout",logout);
app.get("/users/:userID",sendUser);
app.get("/movies/:movieID",sendMovie);
app.get("/people/:peopleID",sendPerson);
app.post("/people/:peopleID",followPerson);
app.get("/people",parseQueryPeople,sendPeople);
app.post("/movies/:movieID",updateMovie,sendMovie);
app.post("/contributing",toggleContributeStatus);
app.get("/users",parseQueryUsers,getUsers);
app.get("/createPerson",getCreatePerson);
app.post("/createPerson",getCreatePerson);
app.post("/followPerson",followPerson)
app.post("/followUser",followUser);
app.post("/addPerson",addPerson);
app.post("/createMovie",getCreateMovie);
app.get("/createMovie",getCreateMovie);
app.use((req, res, next) => {
  res.format({
    'text/html': function(){
      res.status(404).render("errorPage.pug",{session:req.session});
    },
    'application/json': function(){
      res.status(404).send(JSON.stringify({User: u,session: req.session}));
    }
  })
});
class User{
    constructor(username,password){
        this.username = username;
        this.password = password;
        this.following = [];
        this.followingUsers = [];
        this.contributor = false;
        this.reviews = [];
        this.genres = [];
        this.recommend = [];
    }
}
class person{
  constructor(name){
    this.name = name;
    this.movies = [];
    this.poster = "";
  }
}
function addPerson(req,res){
  let Person = req.body;
  console.log(Person);
  if(req.session.Directors == null){
    req.session.Directors = [];
  }
  if(req.session.Writers == null){
    req.session.Writers = [];
  }
  if(req.session.Actors == null){
    req.session.Actors = [];
  }
  if(req.session.Actors.includes(Person.personName) || req.session.Writers.includes(Person.personName)|| req.session.Directors.includes(Person.personName)){
    res.render("createMovie.pug",{session:req.session,Directors:req.session.Directors,Writers:req.session.Writers,Actors:req.session.Actors});
    console.log("Already Exists in current added movie;")
    return;
  }
  let exists = 0;
  if(Person!=null &Person.personName != null & Person.personName.length !=0){
    for(let i = 0;i<people.length;i++){
      if(people[i].name == Person.personName){
        exists = 1;
        break;
      }
    }
  }
  if(Person.personName != null){
    if(exists == 0){
      people.push(new person(Person.personName));
      console.log("Creating new person to fit in new movie");
    }
    if(Person.typeofPerson =="Director"){
      req.session.Directors.push(Person.personName);
    }
    else if (Person.typeofPerson == "Writer"){
      req.session.Writers.push(Person.personName);
    }  
    else if(Person.typeofPerson == "Actor"){
      req.session.Actors.push(Person.personName);
    }
  }
  res.render("createMovie.pug",{session:req.session,Directors:req.session.Directors,Writers:req.session.Writers,Actors:req.session.Actors});
}
function getCreateMovie(req,res){
  if(req.method == "GET"){
    if(req.session == null || req.session.contributor == false || req.session.contributor == null){
      res.status(404).render("errorPage.pug",{session:req.session});
      console.log("User is not a contributor, denying access to createMovie");
      return
    }
    console.log("GET--->Loading createMovie page");
    res.render("createMovie.pug",{session:req.session,Directors:req.session.Directors,Writers:req.session.Writers,Actors:req.session.Actors});
  }
  else if(req.method == "POST"){
    console.log(req.body);
    console.log(req.session);
    if(req.session.Directors.length > 0 && req.session.Writers.length > 0 && req.session.Actors.length>0){
      if(req.body.title!=null && req.body.title.length>0
        &&req.body.plot!=null && req.body.plot.length>0
        &&req.body.year!=null && req.body.year.length>0
        &&req.body.runtime!=null && req.body.runtime.length>0
        &&req.body.released!=null && req.body.released.length>0){
          let id = movies.length;
          let genress = [];
          let averages = 0;
          let reviewss = [];
          genress.push(req.body.genres)
          movies.push({Title:req.body.title,Year:req.body.year,Rated:req.body.rated,Released:req.body.released,Runtime:req.body.runtime,Genre:req.body.genres,genres:genress,Plot:req.body.plot,ActorName:req.session.Actors,WriterName:req.session.Writers,DirectorName:req.session.Directors,numID:id,reviews:reviewss,average:averages,Poster: `https://m.media-amaasdsadasdasdasdzon.com/images/M/MV5BMzk2OTg4MTk1NF5BMl5BanBnXkFtZTcwNjExNTgzNA@@._V1_SX300.jpg`});
          delete req.session.Directors;
          delete req.session.Actors;
          delete req.session.Writers;
          res.render("movieAbout",{session:req.session,Movie:movies[id]});
          return;
        }
      }
      res.render("createMovie.pug",{session:req.session,Directors:req.session.Directors,Writers:req.session.Writers,Actors:req.session.Actors});
    }
}
function followUser(req,res){
  for(i = 0;i<users.length;i++){
    if(users[i].username == req.session.username){
      if(users[i].followingUsers.includes(req.session.User)){
        console.log("Unfollowing "+req.session.User);
        users[i].followingUsers.splice(users[i].followingUsers.indexOf(req.session.User),1);
        break;
      }
      else{
        users[i].followingUsers.push(req.session.User);
        console.log("Following "+req.session.User);
        break;
      }
    }
  }
  res.redirect(`/users/${req.session.User}`);
}
function followPerson(req,res){
  for(i = 0;i<users.length;i++){
    if(users[i].username == req.session.username){
      if(users[i].following.includes(req.session.Person)){
        console.log(users[i].username);
        console.log(users[i].following);
        console.log("Unfollowing "+req.session.Person);
        users[i].following.splice(users[i].following.indexOf(req.session.Person),1);
        break;
      }
      else{
        users[i].following.push(req.session.Person);
        console.log("Following "+req.session.Person);
        break;
      }
    }

  }
  res.redirect(`/people/${req.session.Person}`);
}
function updateMovie(req,res,next){
  console.log("Writing Movie review to database ->",req.body.writeReview);
  let reviewText = ("Rating: "+req.body.Rating+"/5:-->"+req.body.writeReview);
  movie = movies[req.params.movieID];
  movie.reviews.push({text:reviewText,username:req.session.username});
  
  users.forEach(user=>{
    if(user.username == req.session.username){
      user.reviews.push({title:movie.Title,rating: req.body.Rating, review: req.body.writeReview, numID: movie.numID});
      user.genres.push(movie.genres[0]);
      console.log("POST-->Updating user profile to include review");
      req.body.Rating = parseInt(req.body.Rating);
      if(movie.average == null){
        movie.average = (req.body.Rating);
        movie.totalRating = 1;
        movie.totalScores = req.body.Rating;
        console.log("Setting default rating:"+movie.average);
      }
      else{
        movie.totalScores+=req.body.Rating;
        movie.totalRating+=1;
        movie.average = movie.totalScores/movie.totalRating;
      }
      console.log("Updated Movie Rating to: "+movie.average);
    }
  })
  next();
}
function toggleContributeStatus(req,res){
  users.forEach(user=>{
    if(user.username == req.session.username){
      if(user.contributor == true){
        user.contributor = false;
        console.log(`${user.username} is no longer a contributor`);
      }
      else{
        user.contributor = true;
        console.log(`${user.username} is now a contributor`);
        
      }
      req.session.contributor = user.contributor
      res.redirect(`/users/${user.username}`);
    }
  })
}
function logout(req,res){
  console.log("Logging Out " +req.session.username);
  req.session.destroy();

  res.status(200).redirect('/login');
}
function sendUser(req,res){
  let userID = req.params.userID;
  for(i = 0;i<users.length;i++){
    let u = users[i];
    if(userID ===u.username){
      recommendedMovies(u);
      console.log("GET--->Loading " +userID+"'s profile page");
      req.session.User = userID;
      for(y = 0;y<users.length;y++){
        if(users[y].username == req.session.username){
          if(users[y].followingUsers.includes(u.username)){
            //res.status(200).render("user.pug",{User: u,session: req.session,following:true});
            res.format({
              'text/html': function(){
                res.status(200).render("user.pug",{User: u,session: req.session,following:true});
              },
              'application/json': function(){
                res.status(200).send(JSON.stringify({User: u,session: req.session,following:true}));
              }
            })
            return;
          }
          else{
            res.format({
              'text/html': function(){
                res.status(200).render("user.pug",{User: u,session: req.session,following:false});
              },
              'application/json': function(){
                res.status(200).send(JSON.stringify({User: u,session: req.session,following:false}));
              }
            })
            return
          }
        }
      }
      //res.status(200).render("user.pug",{User: u,session: req.session,following:true});
      res.format({
        'text/html': function(){
          res.status(200).render("user.pug",{User: u,session: req.session,following:true});
        },
        'application/json': function(){
          res.status(200).send(JSON.stringify({User: u,session: req.session,following:true}));
        }
      })
      return
    }
  }
  console.log("User does not exist");
  res.format({
    'text/html': function(){
      res.status(404).render("errorPage.pug",{session:req.session});
    },
    'application/json': function(){
      res.status(404).send(JSON.stringify({User: u,session: req.session}));
    }
  })
}
function sendMovie(req,res){
  let movieID = req.params.movieID;
  res.format({
    'text/html': function(){
      //console.log("The request was HTML...");
      if (movies[movieID] ==null){
        console.log("Error: No MovieID exists at the location")
        res.status(404).render("errorPage.pug",{session:req.session});
      }
      else{
        similarMovies(movies[movieID]);
        console.log("GET--->Loading "+movies[movieID].Title);
        res.status(200).render("movieAbout.pug",{Movie:movies[movieID],session: req.session});
      }
    },
    'application/json': function(){
      console.log("Request was JSON");
      if(movies[movieID] ==null){
        res.status(404).send(JSON.stringify(movies[movieID]));
      }
      else{
        similarMovies(movies[movieID]);
        res.status(200).send(JSON.stringify(movies[movieID]));
      }
    }
  })
  
}
function sendPerson(req,res){
  let personID = req.params.peopleID;
  personID = personID.replace("%20","");
  for (let i = 0;i<people.length;i++){
    if (personID===people[i].name){
      console.log("GET--->Loading "+personID+"'s info");
      if(req.session.username != null){
        req.session.Person = people[i].name;
        for (let y = 0;y<users.length;y++){
          if(users[y].username == req.session.username){
            if(users[y].following.includes(people[i].name)){
              res.format({
                'text/html': function(){
                  res.status(200).render("person.pug",{Person:people[i],session: req.session,following:true})
                },
                'application/json': function(){
                  res.status(200).send(JSON.stringify({Person:people[i],session:req.session,following:true}));
                }
              })
              return
            }
            else{
              res.format({
                'text/html': function(){
                  res.status(200).render("person.pug",{Person:people[i],session: req.session,following:false})
                },
                'application/json': function(){
                  res.status(200).send(JSON.stringify({Person:people[i],session:req.session,following:false}));
                }
              })
              return
            }
          }
        }
      }
      res.format({
        'text/html': function(){
          res.status(200).render("person.pug",{Person:people[i],session: req.session})
        },
        'application/json': function(){
          res.status(200).send(JSON.stringify({Person:people[i],session:req.session}));
        }
      })
      return;
    }
  }
  console.log("Person not found");
  res.format({
    'text/html': function(){
      res.status(404).render("errorPage.pug",{session:req.session});
    },
    'application/json': function(){
      res.status(404).send(JSON.stringify({Error:"Does Not exist",session:req.session,following:true}));
    }
  })
}
function parseQueryPeople(req,res,next){
  req.properParams = {};
  if(req.query.name){
    req.properParams.name = req.query.name.toUpperCase();
    console.log("Requires name of: "+req.query.name);
  }
  next();
}
function parseQueryUsers(req,res,next){
  req.properParams = {};
  if(req.query.name){
    req.properParams.name = req.query.name.toUpperCase();
    console.log("Requires name of: "+req.query.name);
  }
  next();
}
function sendPeople(req,res){
  let sentPeople = [];
  for(let i = 0;i<people.length;i++){
    let currentPerson = people[i];
    let foundPerson = (!req.properParams.name || (currentPerson.name.toUpperCase().includes(req.properParams.name)));
    if(foundPerson){
      sentPeople.push(currentPerson);
    }
  }
  res.format({
    'text/html': function(){
      console.log("The request was HTML...");
      if(sentPeople.length == null){
        res.status(404).send(JSON.stringify(sentPeople));
      }
      else{
        console.log("GET--->Loading People's Page");
        res.render("people.pug",{session:req.session,People:sentPeople.slice(0,500)});
      }
    },
    'application/json': function(){
      console.log("Request was JSON");
      if(sentPeople.length == null){
        res.status(404).send(JSON.stringify({session:req.session,People:sentPeople}));
      }
      else{
        res.status(200).send(JSON.stringify({session:req.session,People:sentPeople}))
      }
    }
  }) 
}
function parseQueryMovies(req,res,next){
  req.properParams = {};
  if(req.query.title){
    req.properParams.title = req.query.title.toUpperCase();
    console.log("Require title of: "+req.query.title.toUpperCase());
  }
  if(req.query.year){
    req.properParams.year = req.query.year;
    console.log("Require year of: "+req.query.year);
  }
  if(req.query.minrating){
    req.properParams.minrating = req.query.minrating;
    console.log("require a minimum rating of: "+req.query.minrating);
  }
  if(req.query.genre){
    req.properParams.genre = req.query.genre;
    console.log("require genre of "+req.query.genre);
  }
  next();
}
function getFilms(req,res){
  let sentMovies = [];
  for(let id = 0;id<movies.length;id++){
    let currentMovie = movies[id];
    currentMovie.average = parseInt(currentMovie.average);
    //console.log(currentMovie.Title.toUpperCase().includes(req.properParams.title.toUpperCase()));
    let foundMovie = 
      ((!req.properParams.title) || (currentMovie.Title.toUpperCase().includes(req.properParams.title.toUpperCase())))
      &&((!req.properParams.year) || (req.properParams.year == currentMovie.Year))
      &&((!req.properParams.minrating)|| (req.properParams.minrating) <= (currentMovie.average))
      &&((!req.properParams.genre || (currentMovie.genres.includes(req.properParams.genre))));
    if(foundMovie){
      sentMovies.push(currentMovie);
    }
  }
  res.format({
    'text/html': function(){
      console.log("The request was HTML...");
      if(sentMovies.length == null){
        res.status(404).send(JSON.stringify(sentMovies));
      }
      else{
        console.log("GET--->Loading Movies Page");
        res.render("movies.pug",{session:req.session,movies:sentMovies.slice(0,500)});
      }
    },
    'application/json': function(){
      console.log("Request was JSON");
      if(sentMovies.length == null){
        res.status(404).send(JSON.stringify(sentMovies));
      }
      else{
        res.status(200).send(JSON.stringify(sentMovies));
      }
    }
  })
}
function getUsers(req,res){
  //res.render("users.pug",{users:users,session:req.session})
  let sentUsers = [];
  for(let i = 0;i<users.length;i++){
    let currentUser = users[i];
    let foundUser = (!req.properParams.name || (currentUser.username.toUpperCase().includes(req.properParams.name)));
    if(foundUser){
      sentUsers.push(currentUser);
    }
  }
  res.format({
    'text/html': function(){
      console.log("The request was HTML...");
      if(sentUsers.length == null){
        res.status(404).send(JSON.stringify(sentUsers));
      }
      else{
        console.log("GET--->Loading People's Page");
        res.render("users.pug",{session:req.session,users:sentUsers.slice(0,500)});
      }
    },
    'application/json': function(){
      console.log("Request was JSON");
      if(sentUsers.length == null){
        res.status(404).send(JSON.stringify({session:req.session,users:sentUsers}));
      }
      else{
        res.status(200).send(JSON.stringify({session:req.session,users:sentUsers}))
      }
    }
  }) 
}
function getCreateUser(req,res){
  if(req.method=="GET"){
    console.log("GET--->Loading registration page");
    res.render("createUser.pug")
  }
  else if(req.method=="POST"){
    console.log("POST-->Verifying if name doesn't already exist")
    let user = req.body;
    if(user!=null &user.username != null& user.password!=null &user.username.length!=0 & user.password.length!=0){
      for(let i = 0;i<users.length;i++){
        if(users[i].username==user.username){
          console.log(""+users[i].username+" Already exists!");
          res.render("createUser.pug",{Exists:true})
          console.log("GET--->Loading registration page again");
          return;
        }
      }
      console.log("Added user "+user.username);
      newUser = new User(user.username,user.password)
      users.push(newUser);
      newUser.genres.push("Action");
      res.render("login");
      console.log("Database has been updated, it is now: ");
      console.log(users);
      console.log("GET--->Loading login page");
      return
    }
    console.log("invalid input");
    res.render("createUser.pug",{Invalid:true});
  }
}
function getCreatePerson(req,res){
  if(req.method == "GET"){
    if(req.session == null || req.session.contributor == false || req.session.contributor == null){
      res.status(404).render("errorPage.pug",{session:req.session});
      console.log("User is not a contributor, denying access to createPerson");
      return
    }
    console.log("GET--->Loading createPerson page");
    res.render("createPerson.pug",{session:req.session});
  }
  else if(req.method =="POST"){
    console.log("POST-->Verifying if Actor does not already exist")
    let Person = req.body;
    if(Person!=null &Person.name != null & Person.name.length !=0){
      for(let i = 0;i<people.length;i++){
        if(people[i].name == Person.name){
          console.log(""+Person.name+" Already Exists!");
          res.render("createPerson.pug",{session:req.session,exists:true});
          console.log("GET--->Loading CreatePerson page again");
          return
        }
      }
      people.push(new person(Person.name));
      console.log("Added new person: "+Person.name);
      res.render("createPerson.pug",{session:req.session,added:true});
      console.log("Database has been updated");
      return
    }
    res.render("createPerson",{session:req.session,invalid:true});
  }
}
function getLogin(req,res){
  if(req.session.loggedin == true){
    console.log("User is already logged in, redirecting back to profile");
    res.status(200).redirect(`/users/${req.session.username}`);
  }
  else{
    console.log("GET--->Loading login page");
    res.status(200).render("login",{session:req.session});
  }

}
//When user enters their credentials, verifys if its valid
//If valid, allow them to progress to their own personalized page
//Else display that the password or username was invalid
function postLogin(req,res){
  if(req.session.loggedin == true){
    console.log("User is already logged in, redirecting back to profile");
    res.status(200).redirect(`/users/${req.session.username}`);
  }
  else{
    let user = req.body;
    console.log("POST-->Verifying credentials");
    if(user!=null & user.username!= null & user.password!=null){
      for(let i =0;i<users.length;i++){
        if(users[i].username==user.username){
          if(users[i].password==user.password){
            console.log("Sucessfully logged in "+users[i].username);
            req.session.username = user.username;
            req.session.loggedin = true
            req.session.contributor = users[i].contributor;
            //res.render("user.pug",{User: users[i]});
            res.status(200).redirect(`/movies`);
            return;
          }
          else{
            console.log("Incorrect Password");
            res.render("login",{Incorrect: true});
            return;
          }
        }
      }
    }
    console.log("Invalid");
    res.render("login",{UserExist: false});
  }

}
//fetch recommended movies based on users followings, genres
function recommendedMovies(user){
  let recommended = [];
  console.log("\nLogging recommended Movies for User:",user.username);
  console.log("Genre that it will be based on: "+user.genres[user.genres.length-1]+"\n");
  for(let i =0;i<15;i++){
    if(recommended.length >4){
      return;
    }
    let x = movies[Math.floor(Math.random() * movies.length)];
    if(recommended.includes(x)){
      continue;
    }
    else{
        if(x.genres.includes(user.genres[user.genres.length-1])){
          if(recommended.includes(x)){
          }
          else{
            console.log("Movie: "+ x.Title +"\nGenres: "+x.genres+"\n");
            recommended.push(x);
          }
        }
    }
  }
  console.log("Completed");
  user.recommend = recommended;
}
function similarMovies(movieT){
  let similar = [];
  movieT.similar = [];
  let foundGenre = movieT.genres[Math.floor(Math.random() * movieT.genres.length)]
  //console.log(foundGenre);
  let attempts = 0;
  while(similar.length < 5){
    if(attempts%10 == 0){
      foundGenre = movieT.genres[Math.floor(Math.random() * movieT.genres.length)]
    }
    let x = movies[Math.floor(Math.random() * movies.length)];
    if(!similar.includes(x.Title)&&x.genres.includes(foundGenre) && x.Title.localeCompare(movieT.Title)!=0){
      similar.push(x.numID);
      movieT.similar.push(x);
    }
    attempts+=1;
  }
}
function initLogin(){
    console.log("INITIALIZING USERS/REVIEWS")
    users.push(new User("Nirojan",12345));
    users.push(new User("Inder",12345));
    users[0].following.push("Tom Hanks");
    users[0].following.push("Robin Williams");
    //users[0].following.push(users[1].username);
    users[1].following.push("Pierce Brosnan");
    users[0].genres.push("Action");
    users[0].genres.push("Adventure");
    users[1].genres.push("Comedy");
    users[0].contributor=true;
    users[0].reviews.push({title: "Toy Story", rating: 4, review: "Amazing movie for the kids. Brought lots of fun of joy back when I was a kids. It's still a great movie and is still watchable by today's youth. I'd highly recommend it",numID: 0})
    users[0].reviews.push({title: "Jumanji", rating: 3, review: "Movie had an interesting plot. Probably one of the very few unique movies out there. It however got slow as the end came by. It was a great movie nonetheless",numID: 1})
    movies[0].reviews = [];
    movies[1].reviews = [];
    movies[0].reviews.push({text: "Rating: 4/5: -->"+users[0].reviews[0].review+"\n",username:users[0].username});
    movies[1].reviews.push({text: "Rating: 3/5: -->"+users[0].reviews[1].review+"\n",username:users[0].username});
    movies[0].average = 4;
    movies[0].totalRating = 1;
    movies[0].totalScores = 4;
    movies[1].average = 3;
    movies[1].totalRating = 1;
    movies[1].totalScores = 3;
}
function initReviews(){
  for(i=0;i<movies.length;i++){
    movies[i].reviews= []
  }
  users.push(new User("Bob",12345));
  users.push(new User("Daniel",12345));
  users.push(new User("Bobby",12345));
  users.push(new User("Danielle",12345));
  users.push(new User("Micheal",12345));
  users.push(new User("Danny",12345));
  users.push(new User("Green",12345));
  users.push(new User("Ronald",12345));
  users.push(new User("Daffy",12345));
  users.push(new User("Bugs",12345));
  users.push(new User("Nope",12345));
  users.push(new User("Hope",12345));
  let y = 0;
  for(i = 0;i<500;i++){
    if(i > movies.length-1){
      return;
    }
    if(y >users.length-1){
      y = 0;
    }
    let randomm = Math.floor(Math.random()*6);
    users[y].reviews.push({title:movies[i].Title,rating:randomm,review: "Alright movie",numID:movies[i].numID})
    users[y].genres.push(movies[i].genres[0]);
    movies[i].reviews.push({text: "Rating: "+randomm+"/5: -->Alright movie",username:users[y].username});
    movies[i].totalRating = 1;
    movies[i].average = randomm;
    movies[i].totalScores = randomm;
    y++;
  }
}
let users = [];
initLogin();
initReviews();
console.log("Total people in the Database: "+people.length);
console.log("Total movies in the Database: "+movies.length);
app.listen(3000);
console.log("Server listening at http://localhost:3000")