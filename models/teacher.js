const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: String,
    age: Number,
    active: Boolean,
    date: String,
});

const Teacher = mongoose.model('teacher', teacherSchema);

module.exports = Teacher;