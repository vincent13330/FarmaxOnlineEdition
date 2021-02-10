if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const fs = require('fs')


require('sanitizer')
var nodemailer = require('nodemailer')
const request = require('request')

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'FarmaxDev@gmail.com',
		pass: 'è_é'
	}
})


var mailOptions = {
	from: '',
	to: '',
	subject: '',
	text: '',
}

console.log(mailOptions)
// -------------------------

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id),
)
var path = require("path");
app.use(express.static('views'));
app.use(express.static('images'));
const document = express.static('verification.ejs');
app.use('/static', express.static('views'))


console.log(document)

const users = []

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use(express.json())

var nameUser = '';
var i = 5;

app.get('/', checkAuthenticated, (req, res) => {
	try {
		if (req.user.verificationValide === 1) {
			i = 5;
			console.log("test2")
			console.log(users.verification)
			console.log(users.verificationEntre)
			console.log(req.body.verificationEntre)
			nameUser = req.user.name.replace('&amp;', '&').replace('&lt;', '<').replace('&quot;', '\"').replace('&#039;', '\'');
			do {
				nameUser = nameUser.replace('&amp;', '&').replace('&lt;', '<').replace('&quot;', '\"').replace('&#039;', '\'');
				i ++;
			} while (i <= req.user.name.length)
		  	res.render('index.ejs', { name: nameUser })
		} else if (req.user.verificationValide != 1) {
	  		res.redirect('/verification')
	  	} else {
	  		res.redirect('/login')
	  	}
	} catch {
		res.redirect('/login')
	}
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  	res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))


app.get('/register', checkNotAuthenticated, (req, res) => {
  	res.render('register.ejs', { messagee: '' })
})

var idUser = 1;
var nomberOfUsers = 0;
var compteur = 0;

var sameName = false;
var sameEmail = false;

var osm_email = '';
var osm_name = '';

var name = '';
var email = '';
var password = '';

var verification = 0;

app.post('/register', checkNotAuthenticated, async (req, res) => {
	compteur = 0;
	sameName = false;
	if (nomberOfUsers >= 1) {
		do {
			osm_name = Object.values(users)[compteur].name;
			compteur ++;
			if (req.body.name == osm_name) {
				sameName = true;
			}
		} while (compteur < nomberOfUsers)

		compteur = 0;
		sameEmail = false;
		do {
			osm_email = Object.values(users)[compteur].email;
			compteur ++;
			if (req.body.email == osm_email) {
				sameEmail = true;
			}
		} while (compteur < nomberOfUsers)
	}



	if (req.body.password.length >= 8 && req.body.password === req.body.passwordd && req.body.password.length <= 26 && req.body.name.length >= 4 && req.body.name.length <+ 12 && req.body.email.length <= 56 && sameName == false && sameEmail == false) {
		name = req.body.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
		email = req.body.email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  		try {
    		const hashedPassword = await bcrypt.hash(req.body.password, 10)
    		verification = Math.floor(Math.random() * (999999 - 100000)) + 100000; 
    		users.push({
      		id: idUser,
      		name: name,
      		email: email,
      		password: hashedPassword,
      		verification: verification,
      		verificationEntre: 0,
      		verificationValide: 0,
      		goRegister: 0,
      		nombreEssaieVerification: 5,
		    })

    		mailOptions = {
    			from: 'FarmaxDev@gmail.com',
    			to: email,
    			subject: 'Farmax : Your verification code',
    			text: '',
    			html: '<p id="CodeMessage">Hi, '+ name + '. Your verification Code: ' + verification +
    			'</p> <style>#CodeMessage {width: 400px,border: 2px solid;border-color: #0083FF;border-radius: 5px;background-color: white;margin-top: 3%;font-size: 60px;}</style>'
    		}

    		transporter.sendMail(mailOptions, function(error, info) {
    			if (error) {
    				console.log(error);
    			} else {
    				console.log("Email sent: " + info.response)
    			}
    		})

			console.log(osm_email)
			console.log(osm_name)
			console.log(idUser)
		    idUser += 1;
		    console.log(req.body.password)
		    console.log(users)
		    console.log(Object.values(users)[compteur].name)
		    console.log(Object.values(users)[compteur].verification)
		    nomberOfUsers += 1;
		    res.redirect('/login')
	 	} catch {
	    	res.redirect('/register')
	  	}
	}
	else if (req.body.password.length < 8) 
	{
		res.render('register.ejs', { messagee: 'Your password must be at least 8 characters.' })
	}
	else if (req.body.password.length > 26)
	{
		res.render('register.ejs', { messagee: 'Your password should not exceed 26 characters.' })
	}
	else if (req.body.password != req.body.passwordd)
	{
		res.render('register.ejs', { messagee: 'Your password and your password confirmation are not the same.' })
	}
	else if (req.body.name.length < 4)
	{
		res.render('register.ejs', { messagee: 'Your pseudo must be at least 4 characters.' })
	}
	else if (req.body.name.length > 12)
	{
		res.render('register.ejs', { messagee: 'Your pseudo should not exceed 12 characters' })
	}
	else if (req.body.email.length > 56)
	{
		res.render('register.ejs', { messagee: 'Your email should not exceed 56 characters.' })
	}
	else if (sameName == true && sameEmail == false)
	{
		res.render('register.ejs', { messagee: 'Pseudo already use.' })
	}
	else if (sameEmail == true && sameName == false)
	{
		res.render('register.ejs', { messagee: 'Email already use.' })
	}
	else if (sameEmail == true && sameName == true)
	{
		res.render('register.ejs', { messagee: 'Pseudo and email already use.' })
	}
	else
	{
		res.render('register.ejs', { messagee: 'An unknown error occurred, try to change your pseudo and password.' })
	}
})

const goRegister = 0;
const goLogin = 1;
function fGoRegister(goRegister) {
	goRegister = 1;
}

app.get('/verification', checkAuthenticated, (req, res) => {
	try {
		if (req.user.verificationValide === 1) {
			res.redirect('/')
		} else {
			res.render('verification.ejs', { messagee: '', goRegister: fGoRegister() })
		}
	} catch {
		if (goLogin === 1) {
			res.redirect('/login')
		} else {
			console.log("test")
		  	res.render('verification.ejs', { messagee: '', goRegister: fGoRegister() })
		}
	}
})



var verificationEntreConvert = 0;

app.post('/verification', (req, res) => {
	if (req.body.verificationEntre.length === 6 && req.user.nombreEssaieVerification >= 1) {
		verificationEntreConvert = Number(req.body.verificationEntre)
	}
	try {
		if (req.user.verificationValide === 1) {
			res.redirect('/')
		} else if (req.user.verification != verificationEntreConvert) {
			req.user.nombreEssaieVerification -= 1;
			if (req.user.nombreEssaieVerification > 1) {
				res.render('verification.ejs', { messagee: 'Invalid check. You\'ve got '+req.user.nombreEssaieVerification+' tries left.', goRegister: fGoRegister() })
			} else {
				res.render('verification.ejs', { messagee: 'Invalid check. Be careful, you only have '+req.user.nombreEssaieVerification+' try left.', goRegister: fGoRegister() })
			}
		} else if (req.user.verification === verificationEntreConvert) {
      		req.user.verificationValide = 1;
			console.log(req.user.verificationEntre)
			res.redirect('/')
		} else {
			res.render('verification.ejs', { messagee: 'An unknown error occured.', goRegister: fGoRegister() })
		}
		console.log(req.user.verification)
		console.log(verificationEntreConvert)
	} catch {
		if (req.body.verification.length != 6 && req.user.nombreEssaieVerification >= 1) {
			req.user.nombreEssaieVerification -= 1;
			if (req.user.nombreEssaieVerification > 1) {
				res.render('verification.ejs', { messagee: 'Invalid check. You\'ve got '+req.user.nombreEssaieVerification+' tries left.', goRegister: fGoRegister() })
			} else {
				res.render('verification.ejs', { messagee: 'Invalid check. Be careful, you only have '+req.user.nombreEssaieVerification+' try left.', goRegister: fGoRegister() })
			}
		} else if (req.user.nombreEssaieVerification === 0) {
			res.render('verification.ejs', { messagee: 'Account permanently blocked.', goRegister: fGoRegister() })
		} else {
			res.render('verification.ejs', { messagee: '', goRegister: fGoRegister() })
			console.log("3")
		}
	}
})


app.get('/users', (req, res) => {
	res.json(users)
})

app.post('/users', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10)
		const user = { name: req.body.name, password: hashedPassword }
		users.push(user)
		res.status(201).send()
	} catch {
		res.status(500).send()
	}
})

app.post('/users/login', async (req, res) => {
	const user = users.find(user => user.name = req.body.name)
	if (user == null) {
		return res.status(400).send('Cannot find user')
	}
	try {
		if (bcrypt.compare(req.body.password, user.password)) {
			res.send('Success')
		} else {
			res.send('Not Allowed')
		}
	} catch {
		res.status(500).send()
	}
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(goRegister, req, res, next) {
	console.log("ok1")
  	if (req.isAuthenticated()) {
    	return next()
  	}else if (goRegister === 1) {
  		res.redirect('/register')
  	}else {
  		res.redirect('/login')
  	}
}

function checkNotAuthenticated(goRegister, req, res, next) {
	console.log("ok2")
  	if (req.isAuthenticated()) {
  		try {
	  		if (req.user.verificationValide === 1) {
	    		return res.redirect('/')
	    		console.log("ok3")
	  		} else if (goRegister === 1) {
	  			goRegister = 0;
	  			return res.redirect('/register')
	  		} else {
	  			return res.redirect('/verification')
	  			console.log("ok4")
	  		}
	  	} catch {
	  		if(goRegister === 1) {
		  		return res.redirect('/register')
		  		console.log("ok5")
		  	} else {
		  		return res.redirect('/login')
		  		console.log("ok6")
		  	}
	  	}
  	}

 	next()
}



app.listen(3000)
