const { supabaseAdmin } = require("../db/supabase");

const ADMIN_EMAIL = "admin@resumeos.com";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user      = user;
    req.userId    = user.id;
    req.userEmail = user.email || "";
    req.isAdmin   = user.email === ADMIN_EMAIL
                 || user.user_metadata?.role === "admin";
    next();
  } catch (err) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    const token = authHeader.split(" ")[1];
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      req.user      = user;
      req.userId    = user.id;
      req.userEmail = user.email || "";
      req.isAdmin   = user.email === ADMIN_EMAIL
                   || user.user_metadata?.role === "admin";
    }
  } catch (_) {}
  next();
};

module.exports = { authenticate, optionalAuth };
