// Subscription plan gating middleware
export const requirePro = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.subscriptionPlan !== "Pro") {
    return res.status(403).json({
      message:
        "🔒 This feature requires a Pro subscription. Upgrade to unlock AI-powered diagnosis.",
      upgradeRequired: true,
      currentPlan: req.user.subscriptionPlan,
    });
  }

  next();
};

// Free plan usage limit checker (for patients)
export const checkPatientLimit = async (req, res, next) => {
  try {
    if (req.user.subscriptionPlan === "Pro") return next();

    // Free plan: max 50 patients per clinic admin
    const Patient = (await import("../models/Patient.js")).default;
    const count = await Patient.countDocuments({ createdBy: req.user._id });

    if (count >= 50) {
      return res.status(403).json({
        message:
          "Free plan limit reached (50 patients). Upgrade to Pro for unlimited patients.",
        upgradeRequired: true,
        currentPlan: "Free",
        limit: 50,
        current: count,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
