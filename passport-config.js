const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
require('sanitizer')
const serv = require('./server.js')
var ip = require("ip");

var numberOfIP = 0;
var osm_ip = '';
var ipUsers = [];
var ipAlreadyUse = false;
var compteur = 0;
var localCompteur = 0;
var localEssai = 0;
var localTemps = 0;

function essaiPlus(ipUsers, localCompteur) {
	console.log(ipUsers)
	Object.values(ipUsers)[localCompteur].nombreEssai += 1;
	Object.values(ipUsers)[localCompteur].temps *= 2;
	Object.values(ipUsers)[localCompteur].yesTempsReset = true;
	console.log(ipUsers)
}

function initialize(passport, getUserByEmail, getUserById, req, res) {
	const authenticateUser = async (email, password, done, req, res) => {
		if (numberOfIP >= 1) {
			compteur = 0;
			do {
				osm_ip = Object.values(ipUsers)[compteur].ip
				if (osm_ip === ip.address()) {
					ipAlreadyUse = true;
					localCompteur = compteur;
				}
				compteur++
			} while (compteur < numberOfIP)
		}
		if (ipAlreadyUse === false) {
		  	ipUsers.push({
		  		ip: ip.address(),
		  		nombreEssai: 6,
		  		temps: 1000,
		  		yesTempsReset: true,
		  	})
		  	numberOfIP += 1;
		}
		ipAlreadyUse = false;
		if (Object.values(ipUsers)[localCompteur].nombreEssai >= 1) {
	   		const user = getUserByEmail(email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'))
	   		if (user == null) {
	    		Object.values(ipUsers)[localCompteur].nombreEssai -= 1;
	    		if (Object.values(ipUsers)[localCompteur].yesTempsReset === true) {
	    			Object.values(ipUsers)[localCompteur].yesTempsReset = false
	    			localTemps = Object.values(ipUsers)[localCompteur].temps
	    			setTimeout(essaiPlus, localTemps, ipUsers, localCompteur)
	    			console.log(localCompteur)
	    		}
	    		return done(null, false, { message: 'No user with that email.' })
	    	}
	    	try {
	    		if (await bcrypt.compare(password, user.password)) {
	    			Object.values(ipUsers)[localCompteur].nombreEssai += 1;
	    			localCompteur = 0;
	        		return done(null, user)
	    		} else {
	    			Object.values(ipUsers)[localCompteur].nombreEssai -= 1;
	    			if (Object.values(ipUsers)[localCompteur].yesTempsReset === true) {
	    				Object.values(ipUsers)[localCompteur].yesTempsReset = false
	    				localTemps = Object.values(ipUsers)[localCompteur].temps
	    				setTimeout(essaiPlus, localTemps, ipUsers, localCompteur)
	    				console.log(localCompteur)
	    			}
	        		return done(null, false, { message: 'Password incorrect.' })
	      		}
	    	} catch (e) {
	    		return done(e)
	    	}
	    } else {
	    	return done(null, false, { message: 'Sorry, you have reached the maximum number of tests allowed, try again later.' })
	    }
	}

	passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
	passport.serializeUser((user, done) => done(null, user.id))
	passport.deserializeUser((id, done) => {
	return done(null, getUserById(id))
  	})
}

module.exports = initialize