const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
let noticias = require('./noticias.json');

var handle = exphbs.create({
    defaultLayout: 'main'
    });

    app.use(session({
        secret: 'chave_secreta',
        resave: false,
        saveUninitialized: true
      }));
      
app.use(express.json()); // Para dados JSON
app.use(express.urlencoded({ extended: true })); // Para dados URL-encoded
app.engine('handlebars', handle.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname,"public")));

app.use(flash());
app.use((req, res, next) => {
    res.locals.sucess_msg = req.flash('sucess_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.flashMessage = req.flash('message'); // Define a variável flashMessage
    next();
  });

  app.post('/login', (req,res) => {
    const { user, senha } = req.body; // Captura o nome de usuário e a senha

    if (!user || !senha) {
        req.flash('error_msg', 'Preencha todos os campos!');
        return res.redirect('/login'); // Redireciona se os campos estiverem vazios
    }
    
    if (user === 'caynnan' && senha === '1234') {
        req.session.logado = true;
        req.flash('success_msg', 'Login realizado com sucesso!');
        return res.redirect('/dashboard'); // Redireciona se o login for bem-sucedido
    } else {
        req.flash('error_msg', 'Usuário ou senha não encontrados!');
        return res.redirect('/login'); // Redireciona se as credenciais estiverem erradas
    }    
  })

  app.get('/login', (req, res) => {
        res.render('auth/login');
  });
  
  // Rota que renderiza o template com a mensagem flash
  app.get('/dashboard', (req, res) => {
    if (!req.session.logado) {
        req.flash('error_msg', 'Você precisa estar logado para acessar essa página.'); // Mensagem de erro para acesso não autorizado
        return res.redirect("/login");
    }
    res.render('index');
  });

app.get('/', function(req,res){
    res.render('index', {noticias: noticias});
})

app.listen(3000, function(){
    console.log('[+] Servidor');
})