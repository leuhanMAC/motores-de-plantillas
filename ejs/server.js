const express = require("express");
const Container = require("./contenedor");

const productFiles = new Container("productos.json");
const PORT = process.env.PORT || 3000;

const app = express();
const router = express.Router();

//EJS
app.set("views", "./views");
app.set("view engine", "ejs");

// JSON
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// Router
app.use("/productos", router);

//Middlewares
const postMiddleware = (req, res, next) => {
    const {title, price, thumbnail} = req.body;

    if (!title || !price || !thumbnail) {
        res.status(400).json({
            error: "Faltan datos",
        });
        res.end();
        return;
    }

    next();
};

const urlMiddleware = (req, res, next) => {
    const patternURL = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|webp)/;
    const {thumbnail} = req.body;
    if (!thumbnail) {
        next();
        return;
    } else if (!patternURL.test(thumbnail)) {
        res.status(400).json({
            error: "La URL no está en un formato válido (Debe empezar con el protocolo HTTP y terminar en jpg/gif/png/jpeg/webp)",
        });
        res.end();
        return;
    }

    next();
};

const priceMiddleware = (req, res, next) => {
    const patternPrice = /^(?=.*[1-9])[0-9]*[.]?[0-9]{1,2}$/;
    if (req.body.price) {
        req.body.price = Number(req.body.price);

        if (!patternPrice.test(req.body.price)) {
            res.status(400).json({
                error: "El precio no está en un formato válido (Debe ser un número con máximo dos decimales)",
            });
            res.end();
            return;
        }
    } else if (!req.body.price) {
        next();
        return;
    }

    next();
};

//App
app.get("/", (req, res) => {
    res.render("form");
});

router.get("/", async (req, res) => {
    const products = await productFiles.getAll();
    res.render("productList", {
        products,
        empty: !Boolean(products.length),
    });
});

router.post(
    "/",
    postMiddleware,
    urlMiddleware,
    priceMiddleware,
    async (req, res) => {
        const {title, price, thumbnail} = req.body;
        await productFiles.save({
            title,
            price,
            thumbnail,
        });
        res.redirect("/");
    }
);

app.listen(PORT);
