var express = require('express');
var router = express.Router();
const passport = require("passport");
const userModel = require("./users");
const postModel = require("./posts");
const storyModel = require("./story");
const app = require('../app');
const localStrategy = require("passport-local");
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res){
  res.render('welcome', {footer: false});
})
router.get('/login', function(req, res, next) {
  const error = req.flash('error');
  res.render('index', {footer: false, error});
});

router.get('/feed', isLoggedIn, async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user});
  let posts = await postModel.find().populate("user");
  const tenMin = new Date(Date.now() - 60*10*1000);
  let stories = await storyModel.find({datecreated: {$gt: tenMin} }).populate("user");
  res.render('feed', {footer: true, user, posts, stories});
})

router.get('/register', function(req, res){
  res.render('register', {footer: false});
});

router.get('/profile', isLoggedIn, async function(req, res){
  let user = 
  await userModel
        .findOne({username: req.session.passport.user})
        .populate("posts");
  res.render('profile', {footer: true, user});
});

router.get('/profile/:username', isLoggedIn, async function(req, res){
  let user = await userModel.findOne({username: req.params.username})
  .populate({
    path: "posts",
    match: {isDeleted: {$ne: true}}
  });
  if(!user){
    return res.status(404).send("User not found");
  }
  res.render('profile', {footer: true, user});
});

router.get('/search', isLoggedIn, async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user})
  res.render('search', {footer: true, user});
})

router.get('/edit', isLoggedIn, async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user});
  res.render('edit', {footer: true, user});
});

router.post('/edit', async function(req, res){
  let user = await userModel.findOneAndUpdate(
    {username: req.session.passport.user},
    {username: req.body.username, name: req.body.name, bio: req.body.bio},
    {new: true});
    res.redirect('/profile');
});

router.get('/story', isLoggedIn, async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user});
  res.render('story', {footer: true, user});
});

router.post('/story', isLoggedIn, upload.single("poststory"), async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user});
  let story = await storyModel.create({
    storyImage: req.file?req.file.filename: null,
    user: user._id,
    description: req.body.description 
  });
  user.stories.push(story._id);
  await user.save();
  res.redirect('/feed');
})

router.get('/watch', isLoggedIn, async function(req, res){
  const tenMin = new Date(Date.now() - 10*60*1000);
  let user = 
  await userModel
       .findOne({username: req.session.passport.user})
       .populate({
        path: "stories",
        match: {
          datecreated: {$gt: tenMin}
        }
       });
  res.render('watch', {footer: true, user});
})

router.get('/username/:username', isLoggedIn, async function(req, res){
  let regex = new RegExp(`^${req.params.username}`, 'i')
  let users = await userModel.find({username: regex});
  res.json(users);
})

router.get('/create',isLoggedIn, async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user});
  res.render('create', {footer: true, user});
});

router.post('/create', isLoggedIn, upload.single("postimage"), async function(req, res){
  let user = await userModel.findOne({username: req.session.passport.user});
  let post = await postModel.create({
    image: req.file?req.file.filename: null,
    user: user._id,
    caption: req.body.caption
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect('/feed');
})


router.post('/fileupload', isLoggedIn, upload.single("image"), async function(req, res, next){
  let user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

router.post('/delete/post/:id', isLoggedIn, async function(req, res){
  let post = await postModel.findById(req.params.id);
  if(!post){
    return res.status(404).send("Post not found");
  }
  if(post.user.toString()!== req.user._id.toString()){
    return res.status(403).send("Not Authorized");
  }
  await postModel.findByIdAndDelete(req.params.id);
  res.redirect('/feed');
});


router.post('/register', async function(req, res){
  const { username, email, fullname } = req.body;
  let existingUser = await userModel.findOne({email, username});
  if(existingUser){
    return res.status(400).send("Email or username already registered"); }
  var userdata = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    bio: req.body.bio
  })
  userModel.register(userdata, req.body.password).then(function() {
    passport.authenticate("local")(req, res, function (){
      res.redirect('/feed');
    });
  });
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/feed",
  failureRedirect: "/login",
  failureFlash: true
}), function(req, res){
});

router.get('/logout', function(req, res, next){
  req.logout(function(err){
    if(err){ return next(err); }
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}
module.exports = router;
