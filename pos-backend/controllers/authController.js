const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {

  const { email, password } = req.body;

  try {

    const user = await pool.query(
      "SELECT user_id, name, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        user_id: user.rows[0].user_id,
        role: user.rows[0].role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      role: user.rows[0].role,
      name: user.rows[0].name
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};