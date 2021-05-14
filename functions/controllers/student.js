const firebase = require("firebase")
const moment = require('moment')
const seo_page = require('../client_helpers/seo_page_info')
const mailchimpClient = require('@mailchimp/mailchimp_transactional')( MANDRILL_API_KEY )
const { createCustomer, createCard, charge  } = require('../helpers/payments')
const { prospectData, studentData, updateStudentTags, updateMergeFields, subscribe  } = require("../helpers/subscribe")
const { courseDbName, codeName } = require('../helpers/course_classifier')

//create reference for firestore database
const db = firebase.firestore()

module.exports = {  

    /**
     * @param {String | code } req | the short code of the course name
     * @param {Object | redirect url, redirect boolean, prospect id,and message} res | object containing redirect url, prospect id, and message
     * @param {Object | error} res | error
     */
    registerProspect : async ( req, res, next ) => {
        try {
            //cons
            const { first, last, tel, email } = req.body
            console.log(`prospects ${ req.body }`)
            //add status data - default to FALSE
            const status = {
                course_start: false,
                walk_in: false,
                web_sign_up: true
            }
            //save prospect in the database
            const student = await db.collection('students')
                                    .add( {
                                        enrolledOn : firebase.firestore.Timestamp.fromDate(new Date()),
                                        first, last, tel, email, status
                                    })
            //add tags showing that the student is a prospect
            const tags = ['Prospects']
             //create postdata to send to mailchimp
            const postData = prospectData(email, first, last, tel, student.id, req.params.code, tags)            
            //send student data to mailchimp list/audience for students
            await subscribe( STUDENT_LIST, postData ) 

            //return information to user
            res.status(202).json({
                message: 'Next, choose your class days and times.',
                redirect: true,
                url: `/select-schedule/${req.params.code}`,
                student_id: `${student.id}`

            })
        } catch (error) {
            console.log(`prospects error ${error}`)
            //return information to user
            res.status(500).json({
                message: 'There was an error processing your form details.',
                redirect: false,
                url: `/signup/${req.params.code}`
            })
        }
    },
     /**
      * 
      * @param {*} req 
      * @param {*} res 
      * @param {*} next 
      */
    studentPayRegistration : async ( req, res, next ) => {
        //get course code, course id and student id
        const { amount, code, course_id, student_id, stripeToken } = req.body
        //check to make sure amount and stripeToken exist
        if(parseInt(amount) == 0 || stripeToken == "" || stripeToken == undefined ){
            res.status(404).json({
                message: "Something went wrong!  Try to enter card details again."
            })
        }
        //get the long name of course stored in database
        const course = await courseDbName( code, course_id ) 
                
        try {
            //get student to be updatad
            const results = await db.collection('students').doc( student_id ).get()
            //get student data
            const student = results.data()
            //use student's email, first and last name and telephone to create a customer using stripe api
            const customer = await createCustomer( student.email, student.first, student.last, student.tel )             
            //create a card using customer created from above process
            const card = await createCard( customer, stripeToken )        
            //create a charge
            const chargeId = await charge( card.id, customer, amount, item_description = "Post Course Registration Sign Up - " + course.title ) 
            //insert payment information            
            const payments = [{
                payment_mode: "Credit/Debit card",
                course_name: course.title,
                course_id: course.id, 
                amount: parseInt(amount),        
                chargeId,
                last4: card.last4,
                cardId: card.id,
                created : firebase.firestore.Timestamp.fromDate(new Date())
            }]   
             //update the student in database
            await db.collection('students').doc( student_id ).update({ payments })         
            //registration tag depending on whether they paid or not
            const tags = [ 
                            {"name" : "Paid Course Registration", "status": "active"}, 
                            {"name": "Course Waitlist", "status": "inactive"}
                        ] 
            //update user tags
            updateStudentTags( student.email, tags ) 
            //redirect user to confirm payment page
            res.status(201).json({
                redirect: true,
                redirect_url: '/confirm-payment',
                message: 'You have signed up for '+ course.title
            })

        } catch (error) {
         
            console.log("Stupid error ", error)      
            res.status(500).json({
                "redirect":false,
                "redirect_url":"localhost:3000/courses",
                "message": "Did not sign up for the class."
            })
        }
    },
    /**
     * First view after admin signs up 
     *@param {}: none
     * @returns {Object | students who registered today and sum paid} students who registered today and daily sum
     */
    getDailyRegistrants: async ( req, res, next ) => {
        try {          
            //get today's date
            const today = moment.tz(moment(), "America/Los_Angeles").format("MM/DD/YYYY")

            //query student collection
            const results = await db.collection('students')
                                    .orderBy('enrolledOn', 'desc')
                                    .get()
            //get student documents
            const docs = results.docs            
           
            if( docs.length > 0 ) {

                //filter students who registered today
                const registrants = docs.filter( registrant => {
                    if ( moment.tz(registrant.data().enrolledOn.toDate(), "America/Los_Angeles").format("MM/DD/YYYY") === today){
                       // console.log(registrant.data())
                        return {
                            data: registrant.data(),
                            id: registrant.id
                        } 
                    }
                } ).map( registrant => {

                    return {
                        'name': registrant.data().first+" "+registrant.data().last,
                        'email': registrant.data().email,
                        'id': registrant.id,
                        'tel': registrant.data().tel,
                        'payment': registrant.data().payments.reduce(( sum, payment ) => {        
                            
                            console.log('sum ')
                            //
                            let total = Object.entries(sum).length > 0 ? parseInt(sum.amount) + parseInt(payment.amount) : parseInt(payment.amount)                          
                            //console.log(payment.course_name)
                            return sum = { 
                                            "amount": total, 
                                            "name": payment.course_name,
                                            "code": codeName( payment.course_name ), 
                                            "course_id": payment.course_id 
                                        }
                           
                        }, {})
                    }
                })                
                //sum up the payments made by registrants today
                const daily_sum = registrants.reduce( (sum, doc) => {
                   
                    return sum += doc.payment.amount
                   
                }, 0)

                console.log( 'DAILY REGISTRANTS -- ', registrants )
                res.render('admin/student/dailyregistrations', 
                                { 
                                    registrants: registrants, 
                                    daily_sum: daily_sum, 
                                    seo_info: seo_page.admin_portal_seo_info 
                                }
                            )
                
            } else {
                res.render('admin/student/dailyregistrations', 
                    { 
                        registrants: [], 
                        daily_sum: 0, 
                        seo_info: seo_page.admin_portal_seo_info 
                    }
                )
            } 

        } catch (error) {
            console.log(error)
            res.status(501).json({
                message: 'A server error has occured',
                error
            })
        }
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

            console.log(`REQ BODY ${JSON.stringify(req.body)}`)
            //get student for full name and contact information
            const student = await db.collection('students').doc(student_id).get()
            //student's full name
            const full_name = `${ student.data().first } ${ student.data().last }`      
            console.log(`Jobs ${JSON.stringify(jobs)}`)
            //if the student has contacted more than 1 employer
            if( jobs.length > 0 ) {
                //send employers emails
                jobs.forEach (async( x ) => {                        
                    //get student for full name and contact information
                    const result = await db.collection('jobs').doc(x.job_id).get()
                    
                    const job = result.data()
                    console.log(`student data.... ${student.data()} fullname...${full_name}`)
                    console.log(`INDIVIDUAL JOB APPLICANTS --> ${JSON.stringify(job.applicants)}`)
                    console.log(`INDIVIDUAL JOB APPLICANTS --> ${job.applicants} AND TITLE ${job.title}`)
                    console.log(`INDIVIDUAL JOBS --> ${job}`)
                    console.log(`INDIVIDUAL JOB APPLICANTS --> ${JSON.stringify(job)}`)
                    console.log(`JOBS LENGTH ---> ${job.applicants.length}`)
                    //get the prospects
                    const applicants = job.applicants //.length > 0 ? job.applicants : []

                    console.log(`APPLICANTS --> ${applicants}`)
                    //add the new prospect to the prospects array
                    applicants.unshift({ 
                        full_name,
                        applied: firebase.firestore.Timestamp.fromDate(new Date()), 
                        email: student.data().email,
                        tel: student.data().tel
                    })

                    console.log(`APPLICANTS --> ${applicants}`)
                    //find the student with id of student_id
                    await db.collection('jobs')               
                            .doc(result.id)
                            .update({ applicants }) 
                    //send 
                    await mailchimpClient.messages.sendTemplate({
                        template_name: "student-applicant",
                        template_content: [],
                        message: {
                            from_email: 'jobs@excelcna.com',                        
                            subject: `Caregiver/CNA Job Application for ${job.title}`,                      
                            track_opens: true,
                            track_clicks: true,
                            important: true,
                            merge_language: "handlebars",
                            merge_vars: [{
                                rcpt: job.email,
                                vars: [
                                    { name: 'ORGANIZATION', content: job.facility_name },
                                    { name: 'JOB_TITLE', content:  job.title },
                                    { name: 'STUDENT_FULL_NAME', content: full_name },
                                    { name: 'STUDENT_EMAIL', content: student.data().email },
                                    { name: 'STUDENT_TEL', content: student.data().tel },
                                    { name: 'COURSE', content: student.data().payments[0].course_name }                                
                                ]
                            }],
                            to: [
                                { email: job.email }
                            ]
                        },
                    })
                })
            }            
                     
            //alert employer about student's interest
            res.status(201).json({
                redirect: true,                
                message: "Employers interested in hiring you might contact you.  Keep an eye on your inbox."
            })

        } catch ( error ){
            res.status(500).json({
                redirect: false,                
                message: "Something went wrong when you tried to contact employers."
            })
        }
    },
    /**
     * student register self for an upcoming course
     * @param { String | student data, stripe token, course id, code } - param is course id and code
     * @params: id of the course, code
     * data: student information and stripe token if payment is made
     */
    studentSelfCourseSignUp: async( req, res, next ) => {
        try{        
            //get req params
            const { code, id } = req.params 
            //get the long name of course stored in database
            const course = await courseDbName( code, id )            
            //get the req.body data
            const { stripeToken, student_id, payment } = req.body         
            //check if there is an amount
            const amount = payment > 0 ? parseInt( payment ) : 0            
            //create a payment array
            const payments = []
            //get the student using the student id
            const student = await db.collection('students').doc(student_id).get()              

            //check if there is a stripe token and the amount
            if( stripeToken && amount > 0 ) {
                //use registrant's email, first and last name and telephone to create a customer using stripe api
                const customer = await createCustomer( student.data().email, student.data().first, student.data().last, student.data().tel )   
            
                //create a card using customer created from above process
                const card = await createCard( customer, stripeToken )            
                //create a charge
                const chargeId = await charge( card.id, customer, amount, item_description = "Self Course Sign Up - " + course.title )                
            
                //add payment information
                payments.unshift({
                    payment_mode: "Credit/Debit card",
                    course_name: course.title,
                    course_id: course.id, 
                    amount,        
                    chargeId,
                    last4: card.last4,
                    cardId: card.id,
                    created : firebase.firestore.Timestamp.fromDate(new Date())
                })    

            } else {
                //add course id to the student array of payment objects
                payments.unshift({ 
                    course_id : course.id, 
                    course_name : course.title, 
                    amount,    
                    created : firebase.firestore.Timestamp.fromDate(new Date())
                })                             
            } 

            //registration tag depending on whether they paid or not
            const tags = parseInt( payment ) > 0 ? [ 
                { "name" : "Paid Course Registration", "status": "active" }, 
                { "name" : "Prospects", "status": "inactive" }
            ] : [
                { "name" : "Course Waitlist", "status": "active" }, 
                { "name" : "Prospects", "status": "inactive" }
            ]

            //add student to object            
            await db.collection('students').doc(student_id).update({ payments }) 
        
            //update student tags
            updateStudentTags ( student.data().email, tags )
            //update student merge fields
            updateMergeFields( student.data().email, course.title, course.start, course.end, id )
      
            //check the code of the course
            if(code == 'hca' || code == 'cna' || code == 'bridging') {
                res.status(201).json({
                    redirect: true,
                    student_id: student.id,
                    registered: ( stripeToken && amount > 0 ) ? true : false,
                    redirect_url: '/start-job-search',
                    message: 'You have signed up for '+ course.title
                })
            } else {
                res.status(201).json({
                    redirect: true,                      
                    redirect_url: ( stripeToken && amount > 0 ) ? '/confirm-payment' : '/success',
                    message: 'You have signed up for '+ course.title
                })
            }            

        } catch (error){     
               
            res.status(500).json({
                "redirect":false,
                "redirect_url":"localhost:3000/courses",
                "message": "Did not sign up for the class."
            })
        }
    },
    /*
    * student is registered by an admin for an upcoming course
    * params: id of the course
    * data: student information - no stripe token 
    */
    studentCourseSignUpByAdmin: async( req, res, next ) => {
        try{      
            //get the course id 
            const { course_id, code }  = req.params
           
            const course = await courseDbName( code, course_id )        
                        
            //get the req.body data
            const { address, birthdate, city, comments, email, first, last, payment, payment_mode, state, tel, zip } = req.body 

            //add status data - did the student walk in before course starts and did they start class
            const status = {
                course_start: req.body.course_start ? true: false,
                walk_in: req.body.walk_in ? true: false,
                web_sign_up: false
            }   
            //break birthdate so you can store in firestore
            const dobArray = birthdate.split('-')
            //construct student date of birth date
            const DoB = moment.tz(dobArray[0] +" "+ dobArray[1]+" "+ dobArray[2], "YYYY MM DD", "America/Los_Angeles")
            const dob = DoB.toDate()
                  
            const payments = []

            const amount = payment > 0 ? parseInt( payment ) : 0
            //create an object to add to the beginning of the payments array
            payments.unshift(
                                {   
                                    created : firebase.firestore.Timestamp.fromDate(new Date()), 
                                    course_name: course.title, 
                                    course_id, 
                                    amount,
                                    payment_mode: (payment_mode !== undefined) ? req.body.payment_mode : 'None'
                                }
                            )  
                       
            //save new student and the course after adding the new student
            const student = await db.collection('students')
                                    .add(
                                            {    
                                                address, city, 
                                                enrolledOn: firebase.firestore.Timestamp.fromDate(new Date()),
                                                state, zip, tel, email, first, last, dob, payments, comments, status 
                                            }
                                        )           
            //registration tag depending on whether they paid or not
            const tags = parseInt( payment ) > 0 ? ["Paid Course Registration"] : ["Course Waitlist"]
            //walking tag depending on whether the student visited office in person or not
            status.walk_in ? tags.push("Walk In") : tags
            //the audience in the mailchimp without mailchimp are                                  
            status.course_start ? tags.push("Course Start") : tags
             //create postdata to send to mailchimp
            const postData = studentData( email, first, last, tel, course.data.name, course.data.start_date, course.data.end_date, student.id, course_id, tags, code )              
             //send student data to mailchimp list/audience for students
            await subscribe( STUDENT_LIST, postData )       
           
            console.log('code ', code, 'student id ', student.id, 'course_id', course_id, 'before res.status .....')     
            res.status(201).json({
                 message: `Admin has successfully added the student to ${course.data.title}.`,  
                 student_id: `${student.id}`,
                 code: `${code}`,
                 course_id: `${course_id}`,
                 redirect: true,
                 redirect_url: '/admin/start-job-search'
                 //redirect_url: `/courses/${code}/${course_id}`       
            })
        }catch(error){
            console.log('What is the error -> ', error)
            res.status(500).json({
                message: `There has been an error adding the student.`,
                error
            })
        }       
    },
    /**
     * student information updated by admin
     * params: student id
     * data: student new information - dob, address, payment, comments
     * returns: updated student
     */
    studentUpdateByAdmin: async ( req, res, next ) => {
      try {
       
        //get the course id 
        const { course_id, code }  = req.params
            
        const course = await courseDbName( code, course_id )      
      
        //get student data from the front side
        const { address, birthdate, city,  comments, email, first, last, payment, payment_mode, state, student_id, tel, zip } = req.body
 
        //check for status update
        const status = {
            course_start: req.body.course_start ? true : false,
            walk_in: req.body.walk_in ? true : false
        }       
        //break birthdate so you can store in firestore
        const dobArray = birthdate.split('-')
        //construct student date of birth date
        const DoB = moment.tz(dobArray[0] +" "+ dobArray[1]+" "+ dobArray[2], "YYYY MM DD", "America/Los_Angeles")
        const dob = DoB.toDate()
        //get the student with 'student_id'
        const results = await db.collection('students').doc( student_id ).get()
        //turn it to data
        const student = results.data()
        // const student_payments = student.payments
        const payments = student.payments

        //sum the student payments
        const sum = payments.reduce(( x, paid )=>{
            console.log(`payment: ${ x } and amount: ${paid.amount}` )
            return x += paid.amount
        }, 0 )      
      
        //convert the payment to an integer
        parseInt( payment ) > 0 ? payments.unshift(
            {   
                created: firebase.firestore.Timestamp.fromDate(new Date()), 
                course_name: course.title, 
                course_id, 
                payment_mode: (payment_mode !== undefined) ? req.body.payment_mode : 'None',
                amount : parseInt( payment ) 
            }
        ) : 0
        
        //update the student in database
        await db.collection('students').doc( student_id ).update({
            address, city, comments, dob, email, first, last, payments, state, status, tel, zip
        })        
       
        //registration tag depending on whether they paid or not
        const tags = parseInt( payment ) > 0 && sum == 0 ? [ 
                                                            {"name" : "Paid Course Registration", "status": "active"}, 
                                                            {"name": "Course Waitlist", "status": "inactive"}
                                                        ] : []
        //walking tag depending on whether the student visited office in person or not
        status.walk_in ? tags.push({"name":"Walk In", "status":"active"}) : tags
        //the audience in the mailchimp without mailchimp are                                  
        status.course_start ? tags.push({"name":"Course Start", "status":"active"}) : tags       
        //update student's tags
        if(tags.length > 0 ) { updateStudentTags( email, tags ) }
       
        res.status(201).json({
            message: "Student has been updated",
            redirect: true,
            redirect_url:  `/courses/${code}/${course_id}`         
        })
        //const student = results.data()
        
      } catch (error) {
          console.log('error -> ', error)
            res.status(500).json({
                'message':'There has been an error processing your request',
                error
            })
      }
    },
    /**
     * transfer student to a  by admin
     * params: course_id for old course, course_id for new course and student id
     * returns: student in new course
     */
    transferStudent: async ( req, res, next ) => {
         try {
             console.log( 'REQ PARAMS  -> ', req.body )
            //get req.params 
            const { code, old_course_id, new_course_id, student_id } = req.body
            //query student collection using student id
            const results = await db.collection('students').doc(student_id).get()
            //get student
            const student = results.data()
            //terminate process if studetn doesn't exist
            if(!student){
                return res.status(401).json({
                    message: 'Error fetching the student'
                })
            }
           //query courses collection using new course id
            const course_query = await db.collection('courses').doc(new_course_id).get()

            //get details of the new course
            const new_course = course_query.data()

            //if no such course exists
            if(!new_course){
                return res.status(401).json({
                    message: 'Course you trying to transfer student does not exist.'
                })
            }
            //create course description to send to stripe
            const new_course_name = moment.utc(new_course.start_date.toDate()).format("MMM DD") +' ' + new_course.name + ' ' + new_course.type + ' course' 

            const student_payments = student.payments

            // console.log("STUDENT PAYMENT -> ", student.payments)
            const payments = student_payments.reduce((newPayment, payment) => {
                             
                                if( payment.course_id === old_course_id ){
                                    // return  {
                                        newPayment.push(
                                            {
                                                course_id :new_course_id,
                                                course_name : new_course_name,
                                                transferred : firebase.firestore.Timestamp.fromDate(new Date()),                                                
                                                amount : payment.amount
                                            })
                                    //}
                                } else { newPayment.push(payment) }
                               
                                return newPayment
                    
                            }, [])
            //console.log('OUTSIDE PAYMENTS -> ', payments)               
            await db.collection('students').doc(student_id).update( { payments } )
                 
            res.status(201).json({
                'message': 'Student has been updated',
                'redirect_url': `/courses/${code}/${new_course_id}`,//'/courses/'+new_course_id,
                'redirect': true
            })
         } catch (error) {
              console.log('ERROR -> ERROR ', error)
              res.status(500).json({
                  'message': 'An error has occured'
              })
         }
    },
    /**
    * unenroll student
    * params: id of the course and student
    * data: none
    */
    unenrollStudent: async ( req, res, next ) => {
        try {
            //get the course id and student id
            const { course_id , student_id } = req.params

            //get the student
            const result = await db.collection('students').doc( student_id ).get()

            //get the student data
            const student =  result.data()

            //course information contatined in payment array
            const payments = student.payments.filter( x => {
                if( x.course_id == course_id ){
                    return x = {}
                } else return x.course_id
            })
            console.log('NEW PAYMENTS -> ', payments)               
            await db.collection('students').doc(student_id).update( { payments } )
            //get the course
            return res.redirect('/courses/'+course_id)

        } catch (error) {
            console.log('ERROR -> ERROR ', error)
            res.status(500).json({
                'message': 'An error has occured'
            })
        }
    },
     /**
    * search student
    * params: none
    * data: email
    */
    searchStudent: async ( req, res, next ) => {
        try {  
            //get the course id and student id
            const email = req.body.email

            //get the student
            const result = await db.collection('students').where( "email", "==", email).get()

            //get the student data
            const students =  result.docs

            //if the students length is greater than 0
            if( students.length > 0 ){
                //filter students who registered today
                const registrants = students.map( registrant => {
                    return {
                        'name': registrant.data().first+" "+ registrant.data().last,
                        'email': registrant.data().email,
                        'id': registrant.id,
                        'comments': registrant.data().comments,
                        'tel': registrant.data().tel,
                        'payment': registrant.data().payments.reduce(( sum, payment ) => {                           
                            //
                            let total = Object.entries(sum).length > 0 ? parseInt(sum.amount) + parseInt(payment.amount) : parseInt(payment.amount)                          
                          
                            return sum = { 'amount': total, "name": payment.course_name, "course_id": payment.course_id }

                        }, {})
                    }
                })   
                //return of students
                res.render('admin/student/searchresults', 
                        { 
                            students: registrants,                             
                            seo_info: seo_page.admin_portal_seo_info 
                        })
            } else {
                //return message no student found
                res.render('admin/student/searchresults', 
                        { 
                            message: "No student found with that email.",                             
                            seo_info: seo_page.admin_portal_seo_info 
                        })
            }

        } catch (error) {
            console.log('ERROR -> ERROR ', error)
            res.status(500).json({
                'message': 'An error has occured'
            })
        }
    }  
}