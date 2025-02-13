import { db } from "../connect.js";
const gamePricing = {
  Cricket: 100,
  Shuttle: 150,
  Football: 200,
  Basketball: 250,
};

export const openBooking = (req, res) => {
  const { CID, gamePreference, date, slots, TID } = req.body;
  let totalAmount = 0;

  // Query to get the turf's price per slot
  const turfQuery = `SELECT price FROM turfs WHERE TID = ?`;

  db.query(turfQuery, [TID], (err, turfData) => {
    if (err) return res.status(500).json(err);
    if (!turfData || turfData.length === 0) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const { price } = turfData[0];

    // Calculate total amount based on price of turf and the number of slots
    totalAmount = price * slots.length;

    // Add convenience charge
    const convenienceCharge = 100;
    totalAmount += convenienceCharge;

    // Add tax (5% of total amount)
    const tax = totalAmount * 0.05;
    totalAmount += tax;

    // Get turf name and area
    const { turfName, area } = turfData[0];

    // Insert the booking into the database
    const query = `
      INSERT INTO bookings (CID, TID, date, slot, game, paymentAmount, paymentStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      CID,
      TID,
      date,
      JSON.stringify(slots),
      JSON.stringify(gamePreference),
      totalAmount,
      "Pending",
    ];

    db.query(query, values, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(201).json({
        BID: data.insertId,
        CID,
        TID,
        date,
        slots,
        gamePreference,
        paymentAmount: totalAmount,
        turfName,
        area,
      });
    });
  });
};

export const cancelBooking = (req, res) => {
  const query = `DELETE FROM bookings WHERE BID = ?`;

  db.query(query, [req.params.BID], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.affectedRows === 0)
      return res.status(404).json("Booking not found");
    return res.status(200).json("Booking deleted successfully");
  });
};
