const graphql = require('graphql');
const Course = require('../models/course');
const Teacher = require('../models/teacher');
const User = require('../models/user');
const auth = require('../utils/auth');
const bcrypt = require('bcrypt')

const { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLID, GraphQLBoolean, GraphQLInt, GraphQLString } = graphql;

const CourseType = new GraphQLObjectType({
    name: 'Course',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        languaje: { type: GraphQLString },
        date: { type: GraphQLString },
        teacher: {
            type: TeacherType,
            resolve(parent, args) {
                return Teacher.findById(parent.teacherId);
            }  
        },
        error: { type: GraphQLString }
    })
});

const TeacherType = new GraphQLObjectType({
    name: 'Teacher',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        age: { type: GraphQLInt },
        active: { type: GraphQLBoolean },
        date: { type: GraphQLString },
        course: {
            type: new GraphQLList(CourseType),
            resolve(parent, args) {
                return Course.find({ teacherId: parent.id });
            }
        }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        date: { type: GraphQLString },
    })
});

const MessageType = new GraphQLObjectType({
    name: 'Message',
    fields: () => ({
        message: { type: GraphQLString },
        token: { type: GraphQLString },
        error: { type: GraphQLString }

    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        course: {
            type: CourseType,
            args: { 
                id: { 
                    type: GraphQLString 
                } 
            },
            resolve(parentValue, args, context) {
                if (!context.user.auth) {
                    return { error: 'You must be logged in' };
                }
                return Course.findById(args.id);
            }
        },
        courses:{
            type: new GraphQLList(CourseType),
            resolve(parentValue, args) {
                return Course.find();
            }
        },
        teacher: {
            type: TeacherType,
            args: { 
                name: { 
                    type: GraphQLString 
                } 
            },
            resolve(parentValue, args) {
                return Teacher.findOne({ name: args.name });
            }
        },
        teachers:{
            type: new GraphQLList(TeacherType),
            resolve(parentValue, args) {
                return Teacher.find();
            }
        },
        user: {
            type: UserType,
            args: { 
                email: { 
                    type: GraphQLString 
                } 
            },
            resolve(parentValue, args) {
                return users.find(user => user.email === args.email);
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addCourse: {
            type: CourseType,
            args: {
                name: { type: GraphQLString },
                languaje: { type: GraphQLString },
                date: { type: GraphQLString },
                teacherId: { type: GraphQLID }
            },
            resolve(parentValue, { name, languaje, date, teacherId }) {
                let course = new Course({ name, languaje, date, teacherId });
                return course.save();
            }
        },
        updateCourse: {
            type: CourseType,
            args: {
                id: { type: GraphQLID },
                name: { type: GraphQLString },
                languaje: { type: GraphQLString },
                date: { type: GraphQLString },
                teacherId: { type: GraphQLID }
            },
            resolve(parentValue, {id, name, languaje, date, teacherId }) {
                return Course.findByIdAndUpdate(id, { name, languaje, date, teacherId }, { new: true });
            }
        },
        removeCourse: {
            type: CourseType,
            args: {
                id: { type: GraphQLID }
            },
            resolve(parentValue, { id }) {
                return Course.findByIdAndDelete(id);
            }
        },
        addTeacher: {
            type: TeacherType,
            args: {
                name: { type: GraphQLString },
                age: { type: GraphQLInt },
                active: { type: GraphQLBoolean },
                date: { type: GraphQLString },
            },
            resolve(parentValue, { name, age, active, date }) {
                let teacher = new Teacher({ name, age, active, date });
                return teacher.save();
            }
        },
        updateTeacher: {
            type: TeacherType,
            args: {
                id: { type: GraphQLID },
                name: { type: GraphQLString },
                age: { type: GraphQLInt },
                active: { type: GraphQLBoolean },
                date: { type: GraphQLString },
            },
            resolve(parentValue, {id, name, age, active, date }) {
                return Teacher.findByIdAndUpdate(id, { name, age, active, date }, { new: true });
            }
        },
        removeTeacher: {
            type: TeacherType,
            args: {
                id: { type: GraphQLID }
            },
            resolve(parentValue, { id }) {
                return Teacher.findByIdAndDelete(id);
            }
        },
        addUser: {
            type: MessageType,
            args: {
                name: { type: GraphQLString },
                email: { type: GraphQLString },
                password: { type: GraphQLString },
                date: { type: GraphQLString }
            },
            async resolve(parent, args){
                let user = await User.findOne({email: args.email})
                if(user) return { error: 'This user already exist' }
                const salt = await bcrypt.genSalt(10)
                const hashPassword = await bcrypt.hash(args.password, salt)
                const userData = {...args, password: hashPassword}
                user = new User(userData)
                user.save()
                return { message: 'User created successfully' }
            }
        },
        login: {
            type: MessageType,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString }
            },
            async resolve(parent, args){
                return await auth.login(args.email, args.password, process.env.SECRET_KEY_JWT)
            }
        },
        modifyUser: {
            type: MessageType,
            args: {
                id: { type: GraphQLID },
                name: { type: GraphQLString },
                date: { type: GraphQLString }
            },
            resolve(parent, args, context){
                if(!context.user.auth){
                    return { error: 'You must be logged in' }
                }
                if(args.id === context.user._id) 
                    return User.findByIdAndUpdate(args.id, { name: args.name, date: args.date }, { new: true })
                else
                    return { error: 'You can not modify this user' }
            }
        }
    }
});


module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});