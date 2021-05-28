const firebase = require("firebase")
const moment = require('moment')
const { course_classifier, addCourses, courseDbName, codeName } = require('../helpers/course_classifier.js')
const seo_page = require('../client_helpers/seo_page_info')
//create reference for firestore database
const db = firebase.firestore()
const { getCourseKeyByValue, courseKeys } = require("../helpers/campaign")
module.exports = {    
   /**
    * create a course
    * params: none
    * data: Array of dates, String: course type and name
    */
    addCourses: async (req, res, next) => {
        try{        
           
            //classify course arrays from the front end
            const dayClassDates = req.body.day ? req.body.day : [], 
                  eveningClassDates = req.body.evening ? req.body.evening : [],
                  weekendClassDates = req.body.weekend ? req.body.weekend : []   
            
            //get the day classes         
            const dayClasses = addCourses( dayClassDates, req.body.course, 'Day')                  
            //get the evening classes      
            const eveningClasses = addCourses( eveningClassDates, req.body.course, 'Evening') 
            //get the weekend classes
            const weekendClasses = addCourses( weekendClassDates, req.body.course, 'Weekend')
            //join all the courses together
            const courses = dayClasses.concat( eveningClasses, weekendClasses )

            //How to prevent duplicates in firestore
            //https://stackoverflow.com/questions/54236388/prevent-duplicate-entries-in-firestore-rules-not-working
            
            if(courses.length > 0) {
                courses.forEach(async(course) => {

                    await db.collection('courses').add(course)     
               }) 
               
               res.status(200).json({
                   message: "Courses have been added.",
                   redirect: true,
                   redirect_url: '/admin/course-schedules/enroll'
               })
            }           

        } catch (error){

            console.log('ERROR ->', error)
            res.status(500).json({
                message: `There has been an error adding the course.`,
                error
            })
        }
    },

    /**
     * get single course using id 
     * params: course id
     * returns: a single course object an array of students with that course id in the payments array
     */
    getCourseById: async ( req, res, next ) => {
        try {
            //get the parameters
            const { code, course_id } = req.params        
            //get the course data details
            const course = await courseDbName ( code, course_id )

            console.log('here is the course --> ', course)  
            //get all course students
            const courseStudents = await db.collection('students').orderBy('enrolledOn').get()
            //convert results to array
            const query = courseStudents.docs
            //create an array to store students
            const studentsArray = []
            //store all students in the array
            query.forEach( result => {
                console.log(`data: ${JSON.stringify(result.data())}`)
                studentsArray.unshift({ id: result.id, data: result.data() })
            } )    
       
            const students = studentsArray.map( x => {
               
                return {
                    'id': x.id,
                    'name': x.data.first +" "+ x.data.last,
                    'email': x.data.email,
                    'tel': x.data.tel,
                    'payments': x.data.payments,
                    'status': x.data.status,
                    'amount': x.data.payments != null || x.data.payments != undefined ? x.data.payments.reduce((sum, payment) => {
                                    return sum += payment.amount
                                }, 0 ) : 0
                }
            }).reduce(( course_students, doc ) => {
                
                const student = {
                    'student_id': doc.id,
                    'amount': doc.amount,
                    'email': doc.email,
                    'name': doc.name,
                    'status':doc.status,
                    'tel': doc.tel  
                }

                if(doc.payments != null || doc.payments != undefined){
                    doc.payments.filter( payment => {
                   
                        if(payment.course_id == req.params.course_id){
                     
                            if(!course_students.includes(student)) {
         
                                course_students.push(student)
                            }                        
                        }
                    })
                }                

                return course_students
            }, [] )      
            //sum up the payments made by students enrolled in this course
            const total = students.reduce( (sum, doc) => {
                   
                return sum += doc.amount
               
            }, 0)

            //if course retain this data
            if(course){
                res.render('admin/course/students', 
                                {
                                    // csrfToken: req.csrfToken(),
                                    code: code,
                                    courseId: course.id,
                                    seo_info: seo_page.admin_portal_seo_info, 
                                    title: course.title, 
                                    students: students, 
                                    total: total, 
                                    course: course
                                }
                          )
            }
            
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "There has been an error",
                error
            })
        }
    },
    /**
     * get courses 
     * @params: String: past, present or future
     * @params: default: future
     * returns: array of courses depending on start date (past of today, today or future of today)
     */
    getCourses: async( req, res, next ) => {
        try{
        
            const type = ( req.params.type !== undefined ) ? req.params.type : ""
            const today = moment().startOf('day').toDate()
            let classes = []

            const results = await db.collection('courses')                                        
                                    .orderBy('start_date')   
                                    .get()  

            const docs = results.docs

            
            switch(type){               

                case 'current':

                    classes = docs.reduce((docArray, doc ) => {

                        //convert timestamp to moment object
                        let start =  moment(doc.data().start_date.toDate() )
                        let end = doc.data().end_date ? moment(doc.data().end_date.toDate()) : null
                      
                        if(doc.data().end_date) {   
                            //c                           
                            if( start.isSameOrBefore(today)  && end.isSameOrAfter(today) ){
                                docArray.unshift( 
                                                {
                                                    code: getCourseKeyByValue(courseKeys, doc.data().name),
                                                    name: doc.data().name, 
                                                    type: doc.data().type,
                                                    start_date:  moment(start).format("MMM DD"),
                                                    end_date: moment(end).format("MMM DD"),
                                                    id: doc.id
                                                } )
                            }
                        } else {
                           // console.log(''start.isSame(today) )
                            if (start.isSame(today) ) {
                                docArray.unshift( {
                                    code: getCourseKeyByValue(courseKeys, doc.data().name),
                                    name: doc.data().name, 
                                    type: doc.data().type,
                                    start_date:  moment(start).format("MMM DD"),                                    
                                    id: doc.id
                                 })
                            }
                        }
                     
                        return docArray
                        }, [])                        
                         
                break

                case 'past':
                    //start date and/or end date must be past today
                    classes = docs.reduce((docArray, doc ) => {

                        //convert timestamp to moment object
                        let start =  moment(doc.data().start_date.toDate() )
                        let end = doc.data().end_date ? moment(doc.data().end_date.toDate()) : null
                      
                        if(doc.data().end_date) {   
                                                       
                            if( start.isBefore(today)  && end.isBefore(today) ){
                                docArray.unshift( 
                                                    {
                                                        code: getCourseKeyByValue(courseKeys, doc.data().name),
                                                        name: doc.data().name, 
                                                        type: doc.data().type,
                                                        start_date:  moment(start).format("MMM DD"),
                                                        end_date: moment(end).format("MMM DD"),
                                                        id: doc.id
                                                    } 
                                                )
                            }
                        } else {
                           // console.log(''start.isSame(today) )
                            if (start.isBefore(today) ) {
                                docArray.unshift( {
                                    code: getCourseKeyByValue(courseKeys, doc.data().name),
                                    name: doc.data().name, 
                                    type: doc.data().type,
                                    start_date:  moment(start).format("MMM DD"),                                    
                                    id: doc.id
                                })
                            }
                        }
                      
                        return docArray
                        }, [])                                     

                break

                default:                                     

                    classes = docs.filter(doc => moment( doc.data().start_date.toDate() ).isSameOrAfter(moment(today)) )
                                .map(x=> {
                                    start = x.data().start_date.toDate()
                                    end = x.data().end_date ? x.data().end_date.toDate() : null
                                
                                    return{    
                                        code: getCourseKeyByValue(courseKeys, x.data().name),                        
                                        end_date: end ? moment(end).format("MMM DD") : null, 
                                        name: x.data().name,                            
                                        start_date: moment(start).format("MMM DD"),
                                        type: x.data().type,
                                        id: x.id
                                    }                        
                                })                  
                   
                break
            }

            console.log('CLASSES---- ', classes)
   
            if( classes.length > 0 ){
               
                res.render('admin/course/time-schedules', {
                    courses: course_classifier ( classes ),//groups courses by name, type e.g., CPR has even, day and weekend and BLS only day
                    choices: [
                        "Certified Nurse Assistant/CNA", 
                        "DSHS Home Care Aide/75 Hours",
                        "HCA to CNA Bridging",                         
                        "DSHS Core Basic",                        
                        "DSHS 12 Hours Continuous Education Units",
                        "DSHS Dementia Specialty",
                        "DSHS Mental Health Specialty",
                        "DSHS Safety and Orientation"
                    ],                   
                    seo_info: seo_page.schedule_page_seo_info                                                 
                })
            }
            else{
                res.render('admin/course/time-schedules', {
                    courses: [],//groups courses by name, type e.g., CPR has even, day and weekend and BLS only day
                    choices: [
                        "Certified Nurse Assistant/CNA", 
                        "DSHS Home Care Aide/75 Hours",
                        "HCA to CNA Bridging",                        
                        "DSHS Core Basic",                        
                        "DSHS 12 Hours Continuous Education Units",
                        "DSHS Dementia Specialty",
                        "DSHS Mental Health Specialty",
                        "DSHS Safety and Orientation"
                    ],                   
                    seo_info: seo_page.schedule_page_seo_info                                                 
                })
            }            

        }catch(error){
            console.log("Is there an error? ",error)
            res.status(500).json({
                message: `There has been an error getting the courses.`,
                error: error.message
            })
        }
    },
    /**
    * update an existing course
    * params: course id
    * data: String: course dates,
    */
    updateCourse: async (req, res, next) => {
        try{            
            //get the new dates and course id
            const { course_id, dates }  = req.body
            //check if the course exists
            const courseQuery = await db.collection('courses').doc( course_id ).get()
            //if no such course exists, return
            if(!courseQuery){
                return res.status(404).json({
                    'message': 'No such course exists!'
                })
            }
            //get query data
            const course = courseQuery.data()
            //get present year to append to class dates
            const year = moment().year()   
            //get the course code name
            const code = codeName( courseQuery.data().name )

            console.log('CODE NAME IN UP DATE COURSE', )
            //split the course dates
            const course_date = dates.split(' ')           
            
            //construct start date
            const start_date = moment.tz(year + " "+ course_date[0] +" "+ course_date[1], "YYYY MMM D", "America/Los_Angeles").toDate()

            //construct end date
            const end_date = course_date.length > 2 ? moment.tz(year + " "+ course_date[3] +" "+ course_date[4], "YYYY MMM D", "America/Los_Angeles").toDate() : null
 
             //create course description to send to stripe
            const course_name = moment.utc(start_date).format("MMM DD") +' ' + course.name + ' ' + course.type + ' course'  

            //How to prevent duplicates in firestore
            //https://stackoverflow.com/questions/54236388/prevent-duplicate-entries-in-firestore-rules-not-working
            await db.collection('courses').doc(course_id).update({ start_date, end_date })

            //get all course students
            const courseStudents = await db.collection( 'students' ).orderBy( 'enrolledOn' ).get()
            //convert results to array
            const query = courseStudents.docs
            //create an array to store students
            const studentsArray = []
            //store all students in the array
            query.forEach( result => studentsArray.unshift({ id: result.id, data: result.data() }))   
           
            const students = studentsArray.map( x => {
                return {
                    id: x.id,
                    data: x.data                                  
                }
            }).reduce( ( course_students, doc ) => {               
                //filter to find payment objects containing the course id
                doc.data.payments.filter( async(payment, index ) => {
                    //check if the object has the course id
                    if( payment.course_id == course_id ){
                      
                       // payment.name = course_name
                        doc.data.payments[index].course_name = course_name
                      
                        //if(!course_students.includes(doc)) {
                        await db.collection('students').doc( doc.id ).update({ payments : doc.data.payments })
                        course_students.push(doc)
                       // }                        
                    }
                })

                return course_students
            }, [] )      
            
            res.status(200).json({
                message: "The course has been successfully been updated.",
                redirect: true,
                redirect_url: `/courses/${code}/${course_id}`, 
                students
            })

        } catch (error){

            res.status(500).json({
                message: `There has been an error adding the course.`,
                error
            })
        }
    }  
}