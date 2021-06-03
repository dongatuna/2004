const seo_page = require('../client_helpers/seo_page_info')
const moment = require("moment")
const { course_classifier, courseDbName } = require('../helpers/course_classifier.js')
//const { courseName } = require('../client_helpers/campaign') 
const firebase = require('firebase')
//create reference for firestore database
const db = firebase.firestore()


/**
 * Log into admin to get a sense of all course schedule pages
 * There is a course transfer schedule for admin, student who did not start a class.  Is there one for employer? Delete it if it exists
 * Schedules should be for employer, admin and public
 * 
 * coursestudents view show a course table schedule which when clicked on leads to a roster of the course
 * are transferschedules identical to schedules?
 */

module.exports = {
    /**
     * get page to add courses 
     * @param { }: req - none
     * @param { Object }
     * @return: Object containing seo information and course names
     */   
    addCourseView: (req, res, next ) => {
        //courses array - contains official names of courses
        const courses = [
            "Certified Nurse Assistant/CNA", 
            "DSHS Home Care Aide/75 Hours",
            "HCA to CNA Bridging", 
            "DSHS Nurse Delegation (CORE) for NAs and HCAs",
            "DSHS Nurse Delegation Special Focus on Diabetes",
            "DSHS Core Basic",
            "Adult CPR/First Aid/AED Course Skill Testing",
            "BLS Course Skill Testing",
            "DSHS 12 Hours Continuous Education Units",
            "DSHS Dementia Specialty",
            "DSHS Mental Health Specialty",
            "DSHS Safety and Orientation"
        ]
        //return the course view page
        res.render('admin/course/add', {  
            //csrfToken: req.csrfToken(), 
            seo_info: seo_page.admin_portal_seo_info, 
            courses: courses
        })
    },
 /**
     * student contacts employers about job and/or clinical verification opportunities
     * @param { Object } req - contains student id and array of job ids from front end
     * @param { Object } res - returns message and redirect boolean
     * 
     */
    contactEmployers : async (req, res, next ) => {
        try {        
            //get the data from the front end
            const { student_id, jobs }  = req.body
            //get student for full name and contact information
            const student = await db.collection('students').doc( student_id ).get()
            //student's full name
            const full_name = `${ student.data().first } ${ student.data().last }`      
        
            //if the student has contacted more than 1 employer
            if( jobs.length > 0 ) {
                //send employers emails
                jobs.forEach (async( x ) => {                        
                    //get student for full name and contact information
                    const job = await db.collection('jobs').doc( x.job_id ).get()
                    //get the prospects
                    const prospects = job.data().applicants.length > 0 ? job.data().applicants : []
                    //add the new prospect to the prospects array
                    prospects.unshift[{ 
                        full_name,
                        applied: firebase.firestore.Timestamp.fromDate(new Date()), 
                        email: student.data().email,
                        tel: student.data().tel
                    }]
                    //find the student with id of student_id
                    await db.collection('jobs')               
                            .doc( x.job_id )
                            .update(prospects) 

                    //send 
                    await mailchimpClient.messages.sendTemplate({
                        template_name: "student-applicant",
                        template_content: [],
                        message: {
                            from_email: 'jobs@excelcna.com',                        
                            subject: `Caregiver/CNA Job Application for ${ job.data().title }`,                      
                            track_opens: true,
                            track_clicks: true,
                            important: true,
                            merge_language: "handlebars",
                            merge_vars: [{
                                rcpt: job.data().email,
                                vars: [
                                    { name: 'ORGANIZATION', content: job.data().facility_name },
                                    { name: 'JOB_TITLE', content:  job.data().title },
                                    { name: 'STUDENT_FULL_NAME', content: full_name },
                                    { name: 'STUDENT_EMAIL', content: student.data().email },
                                    { name: 'STUDENT_TEL', content: student.data().tel },
                                    { name: 'COURSE', content: student.data().payments[0].course_name }                                
                                ]
                            }],
                            to: [
                                { email: job.data().email }
                            ]
                        },
                    })
                })
            }            
                 
            //alert employer about student's interest
            res.status(201).json({
                redirect: true,             
               //redirect_url: ``/courses/${code}/${course_id}` `,   
                message: "Employers interested in hiring you might contact you.  Keep an eye on your inbox."
            })

        } catch ( error ){
            res.status(500).json({
                redirect: false, 
                // redirect_url: ``,                
                message: "Something went wrong when you tried to contact employers."
            })
        }
    },
    /**
     * get course schedules view for admin to enroll student 
     * params: String: 'add' or 'transfer' 
     * returns: array of courses starting today or later
     */

    getCourseSchedules: async (req, res, next) => {
        try{

            const today = moment().startOf('day').toDate()            

            const results = await db.collection('courses')                                        
                                    .orderBy('start_date')   
                                    .get()  

            const reservations = await db.collection('reservations')                        
                                         .get()         

            const signups = reservations.docs.map( x => {
                                //
                                return  {
                                    'end_date':  null, 
                                    'name': x.data().name,                            
                                    'start_date': moment(today).format("MMM DD"),
                                    'type': x.data().type,
                                    'id': x.id
                                }
                            })            
       

            const docs = results.docs.filter(doc => moment( doc.data().start_date.toDate() ).isAfter(moment(today)) )
                                .map(x=> {
                                    start = x.data().start_date.toDate()
                                    end = x.data().end_date ? x.data().end_date.toDate() : null
                                
                                    return {                            
                                        'end_date': end ? moment(end).format("MMM DD") : null, 
                                        'name': x.data().name,                            
                                        'start_date': moment(start).format("MMM DD"),
                                        'type': x.data().type,
                                        'id': x.id
                                    }                        
                                })  

            const classes = docs.concat(signups)

            console.log('classes --> ', course_classifier(classes) )                   

            if( classes.length > 0 ){            
                
                //return the course view page               
                res.render('admin/course/schedules', {
                    courses: course_classifier (classes),//groups courses by name, type e.g., CPR has even, day and weekend and BLS only day
                    choices: [
                        "Certified Nurse Assistant/CNA", 
                        "DSHS Home Care Aide/75 Hours",
                        "HCA to CNA Bridging", 
                        "DSHS Nurse Delegation (CORE) for NAs and HCAs",
                        "DSHS Nurse Delegation Special Focus on Diabetes",
                        "DSHS Core Basic",
                        "Adult CPR/First Aid/AED Skill Testing",
                        "BLS Course Skill Testing",
                        "DSHS 12 Hours Continuous Education Units",
                        "DSHS Dementia Specialty",
                        "DSHS Mental Health Specialty",
                        "DSHS Safety and Orientation"
                    ],                   
                    seo_info: seo_page.schedule_page_seo_info ,
                    transfer: req.params.type === 'transfer' ? true: false                             
                })
            }
            
        } catch(err) {
            console.log(err)
            res.status(500).json({
                message: `There has been an error getting the courses.`,
                err
            })
        }       

    },

    /**
     * get course view for admin to edit course dates
     * params: none
     * returns: page, seo information
     */
    editCourseView: (req, res, next ) => {
        res.render('admin/course/edit', { 
            // csrfToken: req.csrfToken(), 
            seo_info: seo_page.admin_portal_seo_info 
        })
    },

    //get 10 jobs to present to a course registrant
    getJobs: async ( req, res, next ) => {     
        try {
            //get 10 most recent jobs
            const results = await db.collection("jobs")
                                    .orderBy("created", "desc")
                                    .limit(10)
                                    .get()

            const jobs = results.docs.map( x => {
                                    return {                                        
                                        id: x.id,
                                        address: x.data().address,
                                        // email: x.data().email,                                   
                                        facility_name: x.data().facility_name,
                                        title: x.data().title,
                                        settings: x.data().settings
                                    }
                                })          
            console.log('jobs ', jobs)
            res.render('admin/student/applyjob', { jobs: jobs, seo_info: seo_page.jobs_page_seo_info })                      
            

        } catch (error) {
            
        }
    },

    getStudentRegisterForm: async ( req, res, next ) => {
        try{   

             //get the course id
            const { course_id, name } = req.params//.course_id 
            
            const course = await courseDbName( name, course_id )

            console.log('course name in admin student register form ', course )
            
            //return the page with the relevant information
            res.render('admin/student/register', 
                                        { 
                                            title : course.title,
                                            courseId : course.id,
                                            code : name,
                                            update : false, 
                                            seo_info: seo_page.admin_portal_seo_info,                                              
                                            student: {} 
                                        })            

        } catch (error){
            console.log(error)
            throw(error)
        }        
    },
     /**
     * get student update form for admin to update student
     * params: String: course id, student id
     * returns: Object: course info, student info, seo info, page view
     */

    getStudentUpdateForm: async ( req, res, next ) => {
        try{          
            //get the student id
            const { course_id, name, student_id } = req.params  
            //find the course
            const course = await courseDbName( name, course_id ) 

            console.log('COURSE....', course)
            //find the student
            const studentQuery = await db.collection('students').doc(student_id).get()
            //get the course data
            const student_results = studentQuery.data()
            //construct data about student - remove payment array
            const student = {
                id: studentQuery.id,               
                address: student_results.address, 
                city: student_results.city, 
                comments: student_results.comments, 
                dob: student_results.dob ? moment.utc(student_results.dob.toDate()).format("YYYY-MM-DD") : "",
                email: student_results.email, 
                first: student_results.first, 
                last: student_results.last, 
                state: student_results.state, 
                status: student_results.status, 
                tel: student_results.tel, 
                zip: student_results.zip               
            }  
         
            //return the page with the relevant information
            res.render('admin/student/register', 
                                { 
                                    update : true, 
                                    seo_info : seo_page.admin_portal_seo_info, 
                                    student : student, 
                                    title : course.title,
                                    courseId : course.id,
                                    code : name
                                }
                            )            

        } catch (error){
            console.log(error)
            throw(error)
        }        
    },

    /**
     * Get all students who were prospects - haven't committed to a course
     * @param {*} req 
     * @param {Object} res 
     * @param {*} next 
     */
    
    getProspects : async (req, res, next) => {
        try{
            console.log(`Hey you there....?`)
            //get all the prospects
            const allProspects = await db.collection("students")
                                    .where("status.prospect", "==", true)                                   
                                    .get()
                                
            //console.log(JSON.stringify(allProspects.docs))                        
            //console.log(`prospects -- ${JSON.stringify(allProspects)}`)
            //get 
            // allProspects.docs.forEach(x => {
            //     console.log(`X, ${JSON.stringify(x.data())} and ${x.id}`)
            // })

            const prospects = allProspects.docs.map(x => {
                return {
                    student_id:x.id,
                    name: `${x.data().first} ${x.data().last}`,
                    tel: x.data().tel,
                    email: x.data().email,
                    code: x.data().code
                }
            })

            console.log(`PROSPECTS ${prospects} and ${prospects.length}`)

            //return the prospects
            if(prospects.length > 0){
                res.render('admin/course/prospects', {
                    seo_info: seo_page.admin_portal_seo_info,
                    prospects: prospects
                })
            }
        } catch (error){

        }
    },
    /**
     * gets view to display student search results
     * params: none
     * returns: page, seo information
     */
    studentSearchResults: ( req, res, next ) => {
        res.render('admin/student/searchresults', { seo_info: seo_page.admin_portal_seo_info })
    },
    /**
     * get view for admin to transfer student from course to course 
     * params: none
     * returns: none
     */
    transferStudent: ( req, res, next ) => {
        res.render('admin/student/transferschedules', { seo_info: seo_page.admin_portal_seo_info })
    }   
}