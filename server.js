const { RSA_NO_PADDING } = require('constants');
const express = require('express');
const { get } = require('http');
const path = require('path');
const fs = require('fs');
var movies = require('./movie-data.json');
const { moveMessagePortToContext } = require('worker_threads');

const app= express();


app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.set("view engine","pug"); 
const session = require('express-session');
const { nextTick, exit } = require('process');

app.use(session({
  cookie: {
    maxAge: 500000000000000000000
  },
  secret: 'Im batman'
}));

app.get("/",getLogin);
app.get("/login.pug",getLogin);
app.post("/login.pug",postLogin);
app.get("/user.pug",getUserPage);
app.get("/movies",parseQueryMovies,getFilms);
app.post("/movies",getMovies);
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
app.post("/people",searchPeople);
app.post("/users",searchUsers);
app.post("/addPerson",addPerson);
app.post("/createMovie",getCreateMovie);
app.get("/createMovie",getCreateMovie);
app.listen(3000);
console.log("Server listening at http://localhost:3000")
//movies = [...new Set(movies)];
//var movies = [{"Title":"Toy Story","Year":"1995","Rated":"G","Released":"22 Nov 1995","Runtime":"81 min","Genre":"Animation, Adventure, Comedy, Family, Fantasy","Director":"John Lasseter","Writer":"John Lasseter (original story by), Pete Docter (original story by), Andrew Stanton (original story by), Joe Ranft (original story by), Joss Whedon (screenplay by), Andrew Stanton (screenplay by), Joel Cohen (screenplay by), Alec Sokolow (screenplay by)","Actors":"Tom Hanks, Tim Allen, Don Rickles, Jim Varney","Plot":"A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room.","Language":"English","Country":"USA","Awards":"Nominated for 3 Oscars. Another 27 wins & 20 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFqcGdeQXVyNDQ2OTk4MzI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.3/10"},{"Source":"Rotten Tomatoes","Value":"100%"},{"Source":"Metacritic","Value":"95/100"}],"Metascore":"95","imdbRating":"8.3","imdbVotes":"864,385","imdbID":"tt0114709","Type":"movie","DVD":"20 Mar 2001","BoxOffice":"N/A","Production":"Buena Vista","Website":"N/A","Response":"True"},{"Title":"Jumanji","Year":"1995","Rated":"PG","Released":"15 Dec 1995","Runtime":"104 min","Genre":"Adventure, Comedy, Family, Fantasy","Director":"Joe Johnston","Writer":"Jonathan Hensleigh (screenplay by), Greg Taylor (screenplay by), Jim Strain (screenplay by), Greg Taylor (screen story by), Jim Strain (screen story by), Chris Van Allsburg (screen story by), Chris Van Allsburg (based on the book by)","Actors":"Robin Williams, Jonathan Hyde, Kirsten Dunst, Bradley Pierce","Plot":"When two kids find and play a magical board game, they release a man trapped in it for decades - and a host of dangers that can only be stopped by finishing the game.","Language":"English, French","Country":"USA","Awards":"4 wins & 11 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BZTk2ZmUwYmEtNTcwZS00YmMyLWFkYjMtNTRmZDA3YWExMjc2XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.0/10"},{"Source":"Rotten Tomatoes","Value":"54%"},{"Source":"Metacritic","Value":"39/100"}],"Metascore":"39","imdbRating":"7.0","imdbVotes":"297,463","imdbID":"tt0113497","Type":"movie","DVD":"25 Jan 2000","BoxOffice":"N/A","Production":"Sony Pictures Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Grumpier Old Men","Year":"1995","Rated":"PG-13","Released":"22 Dec 1995","Runtime":"101 min","Genre":"Comedy, Romance","Director":"Howard Deutch","Writer":"Mark Steven Johnson (characters), Mark Steven Johnson","Actors":"Walter Matthau, Jack Lemmon, Sophia Loren, Ann-Margret","Plot":"John and Max resolve to save their beloved bait shop from turning into an Italian restaurant, just as its new female owner catches Max's attention.","Language":"English, Italian, German","Country":"USA","Awards":"2 wins & 2 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMjQxM2YyNjMtZjUxYy00OGYyLTg0MmQtNGE2YzNjYmUyZTY1XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.7/10"},{"Source":"Rotten Tomatoes","Value":"17%"},{"Source":"Metacritic","Value":"46/100"}],"Metascore":"46","imdbRating":"6.7","imdbVotes":"23,736","imdbID":"tt0113228","Type":"movie","DVD":"18 Nov 1997","BoxOffice":"N/A","Production":"Warner Home Video","Website":"N/A","Response":"True"},{"Title":"Waiting to Exhale","Year":"1995","Rated":"R","Released":"22 Dec 1995","Runtime":"124 min","Genre":"Comedy, Drama, Romance","Director":"Forest Whitaker","Writer":"Terry McMillan (novel), Terry McMillan (screenplay), Ronald Bass (screenplay)","Actors":"Whitney Houston, Angela Bassett, Loretta Devine, Lela Rochon","Plot":"Based on Terry McMillan's novel, this film follows four very different African-American women and their relationships with the male gender.","Language":"English","Country":"USA","Awards":"9 wins & 10 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYzcyMDY2YWQtYWJhYy00OGQ2LTk4NzktYWJkNDYwZWJmY2RjXkEyXkFqcGdeQXVyMTA0MjU0Ng@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.9/10"},{"Source":"Rotten Tomatoes","Value":"56%"}],"Metascore":"N/A","imdbRating":"5.9","imdbVotes":"9,272","imdbID":"tt0114885","Type":"movie","DVD":"06 Mar 2001","BoxOffice":"N/A","Production":"Twentieth Century Fox Home Entertainment","Website":"N/A","Response":"True"},{"Title":"Father of the Bride Part II","Year":"1995","Rated":"PG","Released":"08 Dec 1995","Runtime":"106 min","Genre":"Comedy, Family, Romance","Director":"Charles Shyer","Writer":"Albert Hackett (screenplay \"Father's Little Dividend\"), Frances Goodrich (screenplay \"Father's Little Dividend\"), Nancy Meyers (screenplay), Charles Shyer (screenplay)","Actors":"Steve Martin, Diane Keaton, Martin Short, Kimberly Williams-Paisley","Plot":"George Banks must deal not only with the pregnancy of his daughter, but also with the unexpected pregnancy of his wife.","Language":"English","Country":"USA","Awards":"Nominated for 1 Golden Globe. Another 1 win & 1 nomination.","Poster":"https://m.media-amazon.com/images/M/MV5BOTEyNzg5NjYtNDU4OS00MWYxLWJhMTItYWU4NTkyNDBmM2Y0XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.0/10"},{"Source":"Rotten Tomatoes","Value":"48%"},{"Source":"Metacritic","Value":"49/100"}],"Metascore":"49","imdbRating":"6.0","imdbVotes":"33,337","imdbID":"tt0113041","Type":"movie","DVD":"09 May 2000","BoxOffice":"N/A","Production":"Disney","Website":"N/A","Response":"True"},{"Title":"Heat","Year":"1995","Rated":"R","Released":"15 Dec 1995","Runtime":"170 min","Genre":"Crime, Drama, Thriller","Director":"Michael Mann","Writer":"Michael Mann","Actors":"Al Pacino, Robert De Niro, Val Kilmer, Jon Voight","Plot":"A group of professional bank robbers start to feel the heat from police when they unknowingly leave a clue at their latest heist.","Language":"English, Spanish","Country":"USA","Awards":"14 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMDJjNWE5MTEtMDk2Mi00ZjczLWIwYjAtNzM2ZTdhNzcwOGZjXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"8.2/10"},{"Source":"Rotten Tomatoes","Value":"87%"},{"Source":"Metacritic","Value":"76/100"}],"Metascore":"76","imdbRating":"8.2","imdbVotes":"560,172","imdbID":"tt0113277","Type":"movie","DVD":"27 Jul 1999","BoxOffice":"N/A","Production":"Warner Bros.","Website":"N/A","Response":"True"},{"Title":"Sabrina","Year":"1995","Rated":"PG","Released":"15 Dec 1995","Runtime":"127 min","Genre":"Comedy, Drama, Romance","Director":"Sydney Pollack","Writer":"Samuel A. Taylor (play), Billy Wilder (earlier screenplay), Samuel A. Taylor (earlier screenplay), Ernest Lehman (earlier screenplay), Barbara Benedek (screenplay), David Rayfiel (screenplay)","Actors":"Harrison Ford, Julia Ormond, Greg Kinnear, Nancy Marchand","Plot":"An ugly duckling having undergone a remarkable change, still harbors feelings for her crush: a carefree playboy, but not before his business-focused brother has something to say about it.","Language":"English, French","Country":"Germany, USA","Awards":"Nominated for 2 Oscars. Another 2 wins & 4 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BYjQ5ZjQ0YzQtOGY3My00MWVhLTgzNWItOTYwMTE5N2ZiMDUyXkEyXkFqcGdeQXVyNjUwMzI2NzU@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"6.3/10"},{"Source":"Rotten Tomatoes","Value":"65%"},{"Source":"Metacritic","Value":"56/100"}],"Metascore":"56","imdbRating":"6.3","imdbVotes":"35,527","imdbID":"tt0114319","Type":"movie","DVD":"15 Jan 2002","BoxOffice":"N/A","Production":"Paramount","Website":"N/A","Response":"True"},{"Title":"Tom and Huck","Year":"1995","Rated":"PG","Released":"22 Dec 1995","Runtime":"97 min","Genre":"Adventure, Comedy, Drama, Family, Romance, Western","Director":"Peter Hewitt","Writer":"Mark Twain (novel), Stephen Sommers (screenplay), David Loughery (screenplay)","Actors":"Jonathan Taylor Thomas, Brad Renfro, Eric Schweig, Charles Rocket","Plot":"Two best friends witness a murder and embark on a series of adventures in order to prove the innocence of the man wrongly accused of the crime.","Language":"English","Country":"USA","Awards":"1 win & 5 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BN2ZkZTMxOTAtMzg1Mi00M2U0LWE2NWItZDg4YmQyZjVkMDdhXkEyXkFqcGdeQXVyNTM5NzI0NDY@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.5/10"},{"Source":"Rotten Tomatoes","Value":"25%"}],"Metascore":"N/A","imdbRating":"5.5","imdbVotes":"9,621","imdbID":"tt0112302","Type":"movie","DVD":"06 May 2003","BoxOffice":"N/A","Production":"Buena Vista","Website":"N/A","Response":"True"},{"Title":"Sudden Death","Year":"1995","Rated":"R","Released":"22 Dec 1995","Runtime":"111 min","Genre":"Action, Crime, Thriller","Director":"Peter Hyams","Writer":"Karen Elise Baldwin (story), Gene Quintano (screenplay)","Actors":"Jean-Claude Van Damme, Powers Boothe, Raymond J. Barry, Whittni Wright","Plot":"A former fireman takes on a group of terrorists holding the Vice President and others hostage during the seventh game of the NHL Stanley Cup finals.","Language":"English","Country":"USA","Awards":"N/A","Poster":"https://m.media-amazon.com/images/M/MV5BN2NjYWE5NjMtODlmZC00MjJhLWFkZTktYTJlZTI4YjVkMGNmXkEyXkFqcGdeQXVyNDc2NjEyMw@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"5.8/10"},{"Source":"Rotten Tomatoes","Value":"51%"}],"Metascore":"N/A","imdbRating":"5.8","imdbVotes":"31,424","imdbID":"tt0114576","Type":"movie","DVD":"01 Nov 1998","BoxOffice":"N/A","Production":"MCA Universal Home Video","Website":"N/A","Response":"True"},{"Title":"GoldenEye","Year":"1995","Rated":"PG-13","Released":"17 Nov 1995","Runtime":"130 min","Genre":"Action, Adventure, Thriller","Director":"Martin Campbell","Writer":"Ian Fleming (characters), Michael France (story), Jeffrey Caine (screenplay), Bruce Feirstein (screenplay)","Actors":"Pierce Brosnan, Sean Bean, Izabella Scorupco, Famke Janssen","Plot":"Years after a friend and fellow 00 agent is killed on a joint mission, a secret space based weapons program known as \"GoldenEye\" is stolen. James Bond sets out to stop a Russian crime syndicate from using the weapon.","Language":"English, Russian, Spanish","Country":"UK, USA","Awards":"Nominated for 2 BAFTA Film Awards. Another 2 wins & 6 nominations.","Poster":"https://m.media-amazon.com/images/M/MV5BMzk2OTg4MTk1NF5BMl5BanBnXkFtZTcwNjExNTgzNA@@._V1_SX300.jpg","Ratings":[{"Source":"Internet Movie Database","Value":"7.2/10"},{"Source":"Rotten Tomatoes","Value":"78%"},{"Source":"Metacritic","Value":"65/100"}],"Metascore":"65","imdbRating":"7.2","imdbVotes":"233,822","imdbID":"tt0113189","Type":"movie","DVD":"19 Oct 1999","BoxOffice":"N/A","Production":"MGM/UA","Website":"N/A","Response":"True"}]
var people = [];
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
          films[id] = movies[id];
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

  res.status(200).redirect('/login.pug');
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
  res.status(404).render("errorPage.pug",{session:req.session});
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
              //res.status(200).render("person.pug",{Person:people[i],session: req.session, following:true})
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

function initRest(){
  console.log("Initializing people");
  let tempPeople = [];
  let actors = [];
  let directors = [];
  let writers = [];
  movies.forEach(movie=>{
    actors.push(movie.Actors.split(','));
    directors.push(movie.Director.split(','));
    writers.push(movie.Writer.split(','));
  })
  actors.forEach(actor=>{
    actor.forEach(Person=>{
      Person = Person.split("(")[0].trim();
      if(!tempPeople.includes(Person)){
        tempPeople.push(Person);
      }
    })
  })
  directors.forEach(director=>{
    director.forEach(Person=>{
      Person = Person.split("(")[0].trim();
      if(!tempPeople.includes(Person)){
        tempPeople.push(Person);
      }
    })
  })
  writers.forEach(writer=>{
    writer.forEach(Person=>{
      Person = Person.split("(")[0].trim();
      if(!tempPeople.includes(Person)){
        tempPeople.push(Person);
      }
    })
  })
  tempPeople.forEach(Person=>{
    people.push(new person(Person));
    movies.forEach(movie=>{
      if (movie.ActorName == null){
        movie.ActorName = [];
      }
      if (movie.DirectorName == null){
        movie.DirectorName = [];
      }
      if (movie.WriterName == null){
        movie.WriterName = [];
      }
      if(movie.Actors.includes(people[people.length-1].name) ||movie.Director.includes(people[people.length-1].name) ||movie.Writer.includes(people[people.length-1].name)){
        people[people.length-1].movies.push(movie);
        if(movie.Actors.includes(people[people.length-1].name)){
          movie.ActorName.push(people[people.length-1].name);
        }
        if(movie.Director.includes(people[people.length-1].name)){
          movie.DirectorName.push(people[people.length-1].name);
          //console.log("Added to Director Names: "+people[people.length-1].name);
        }
        if(movie.Writer.includes(people[people.length-1].name)){
          movie.WriterName.push(people[people.length-1].name);
          //console.log("Added to Writer Names: "+people[people.length-1].name);
        }
      }
    })
  })
  let index = 0;
  let parsedMovies = [];
  console.log("Parsing Movies Accordingly")
  movies.forEach(movie=>{
    movie.numID = index;
    genres = movie.Genre.split(",");
    movie.genres = genres;
    // for(let i = 0;i<movie.genres.length;i++){
    //   genres[movie.genres[i]] = 1;
    // }
    movie.reviews = [];
    movie.average = 0;
    parsedMovies.push({Title:movie.Title,Year: movie.Year,Rated:movie.Rated,Released: movie.Released,Runtime:movie.Runtime,Genre:movie.Genre,genres:movie.genres,Plot:movie.Plot,ActorName:movie.ActorName,WriterName:movie.WriterName,DirectorName:movie.DirectorName,Poster:movie.Poster,numID:movie.numID,reviews:movie.reviews,average:movie.average});
    index++;
    //Purpose of parameters
    films[movie.numID] = movie;
  })
  movies = parsedMovies;
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
var films = {};
initRest();
initLogin();
initReviews();
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
console.log("Total people in the Data base: "+people.length);
console.log("Total movies in the Data base: "+movies.length);
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
      users.push(new User(user.username,user.password));
      res.render("login.pug");
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
function getMovies(req,res){
  if(req.method=="GET"){
    console.log("GET--->Loading movies page")
    res.render("movies.pug",{movies:movies.slice(0,100),session:req.session});
  }
  else if(req.method =="POST"){
    console.log("POST-->Searching for movie");
    searchMovie(req,res);
  }
  
}
function getLogin(req,res){
  console.log("GET--->Loading login page");
  res.status(200).render("login.pug",users);
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
            res.render("login.pug",{Incorrect: true});
            return;
          }
        }
      }
    }
    console.log("Invalid");
    res.render("login.pug",{UserExist: false});
  }

}

//Gets user page
function getUserPage(req,res){
  res.render("user.pug")
}
//
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
      //console.log("ReDrawing: "+foundGenre);
    }
    let x = movies[Math.floor(Math.random() * movies.length)];
    //console.log(x.Title);
    if(!similar.includes(x.Title)&&x.genres.includes(foundGenre) && x.Title.localeCompare(movieT.Title)!=0){
      similar.push(x.numID);
      movieT.similar.push(x);
    }
    attempts+=1;
  }
  //console.log(similar);
}
function searchMovie(req,res){
  let body=req.body;
  let searchedMovies = [];
  movies.forEach(movie=>{
    if(movie.Title.toLowerCase().includes(body.searchMovie.toLowerCase())){
      searchedMovies.push(movie);
    }
  })
  res.render("movies.pug",{movies:searchedMovies.slice(0,30),session:req.session});
}
function searchPeople(req,res){
  let body = req.body;
  let searchedPeople = [];
  people.forEach(Person=>{
    if(Person.name.toLowerCase().includes(body.searchPeople.toLowerCase())){
      searchedPeople.push(Person);
    }
  })
  res.status(200).render("people",{session:req.session,People:searchedPeople});
}
function searchUsers(req,res){
  let body = req.body;
  let searchedUsers = [];
  users.forEach(user=>{
    if(user.username.toLowerCase().includes(body.searchUsers.toLowerCase())){
      searchedUsers.push(user);
    }
  })
  res.status(200).render("users",{session:req.session,users:searchedUsers});
}