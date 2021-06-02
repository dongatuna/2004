const firebase = require("firebase")
const moment = require('moment')
const mailchimpClient = require('@mailchimp/mailchimp_transactional')( MANDRILL_API_KEY )
const client = require("@mailchimp/mailchimp_marketing")
const db = firebase.firestore()

module.exports = {
  //Every Monday at 8:00 am, send students who signed up in the last 6 months job openings created last 7 days
  notifyStudents : async ( num ) => {   
      console.log('notify students ', num )
      //parse the parameter to integer
      const day = parseInt(num)
  
      //1. create time markers for the start and/or end of the week            
      const start = moment().subtract(day, 'day').startOf('day')
      const end = moment()//.subtract(0, 'day').endOf('day')

      //2.  get all jobs
      const allJobs = await db.collection('jobs')
                            .orderBy("created", "desc")
                            .get()

      // let start =  moment(doc.data().start_date.toDate() )
      //3.  filter jobs that have been created in the last 7 days
      const jobs = allJobs.docs.filter( job => moment(job.data().created.toDate()).isAfter(start) 
                                              && moment(job.data().created.toDate()).isBefore(end) 
                                ).map( job => {
                              
                                  return {
                                    url: `https://www.excelcna.com/job/view/${job.id}`,
                                    title: job.data().title,
                                    name: job.data().facility_name
                                  }
                                })
    //console.log(`jobs ${JSON.stringify(jobs)}`)                          
    //console.log('students ', students )
    const subject = day === 7 ? 'Weekly CNA/Caregiver job openings' : 'New CNA/Caregiver job openings!'  

    if( jobs.length > 0 ) {
      //4.  create time marker of the last 6 months         
    // const enrolledOn = moment().subtract(180, 'day').startOf('day')
      const enrolledOn = moment().subtract(10, 'day').startOf('day')
      //5.  get all students who signed up in the last 6 months and send them job email notifications
      const allStudents = await db.collection('students')
                            .orderBy("enrolledOn", "desc")
                            .get()

      //6. filter students who enrolled within the last 6 months
      const students = allStudents.docs.filter( x => moment(x.data().enrolledOn.toDate()).isAfter(enrolledOn) )
                                  .map(x => {
                                    return {
                                      name: `${x.data().first} ${x.data().last}`,
                                      email: `${x.data().email}`
                                    }
                                  })
    
      //7.  send students above jobs
      students.forEach( async (student) => {
        //console.log(`student: ${student}`)

        await mailchimpClient.messages.sendTemplate({
          template_name: "jobs-openings",
          template_content: [],
          message: {
            from_email: 'jobs@excelcna.com',                        
            subject: `${ student.name }, [APPLY FOR JOBS] - ${ subject }`,                      
            track_opens: true,
            track_clicks: true,
            important: true,
            merge_language: "handlebars",
            merge_vars: [{
                rcpt: student.email,
                vars: [      
                    { name: 'JOBS', content: jobs },
                    { name: 'STUDENT_NAME', content: student.name }                       
                ]
            }],
            to: [
                { email: student.email }
            ]
          }
        })    
      })      
    }    
  },
  //Every Monday 8 a.m., send summary applicants and prospect  to a job openings
  notifyEmployers : async ( num ) => { 
    //parse the parameter to integer
    const day = parseInt( num )    
    
    //1. create time markers for the start and/or end of the week            
    const start = moment().subtract(day, 'day').startOf('day')
    const end = moment()
                                         
    //2.  get all jobs 
    const employer_jobs =  await db.collection('jobs')
                                  .orderBy("created", "desc")
                                  .get()                                     

    //5. get jobs with more than 1 applicant and were posted within the last 7 days
    const jobs = employer_jobs.docs.filter( x => x.data().created >= start && x.data().created <= end )
                                    .filter( x => x.data().applicants.length > 0 || x.data().propects.length > 0 )
                                    .map( x => {
                                      return {
                                        //id: x.id,
                                        title: x.data().title,
                                        facility_name: x.data().facility_name,
                                        applicants: x.data().applicants,
                                        url: `https://www.excelcna.com/job/view/${x.id}`,
                                        prospects: x.data().propects,
                                        email: x.data().email
                                      }
                                    })
      //check if there has been any job posting                              
      if(jobs.length > 0 ){
        jobs.forEach(async(job) => {  
          //check if each job has at least one applicant or prospect
          if( job.applicants.length > 0 || job.prospects.length > 0 ) {
            await mailchimpClient.messages.sendTemplate({
              template_name: "caregiver-cna-applicants",
              template_content: [],
              message: {
                from_email: 'jobs@excelcna.com',                        
                subject: `Caregivers and CNAs intered in working for ${ job.facility_name }`,                      
                track_opens: true,
                track_clicks: true,
                important: true,
                merge_language: "handlebars",
                merge_vars: [{
                    rcpt: job.email,
                    vars: [
                      { name: 'APPLICANTS', content: job.applicants }, 
                      { name: 'PROSPECTS', content: job.prospects },                  
                      { name: 'JOB_URL', content: job.url },
                      { name: 'ORGANIZATION', content: job.facility_name },
                      { name: 'TITLE', content: job.title }                                                       
                    ]
                }],
                to: [
                    { email: job.email }
                ]
              } 
            })
          }    
          
        }) 
      }
  },
  //notify employers about upcoming courses
  upcomingCoursesNotifications : async () => {
    //get employer list member with subscribe status
    client.setConfig({
      apiKey: MAILCHIMP_API_KEY,
      server: "us4",
    });
    try { 
      //get the employers from mailchimp who are still subscribers
      const response = await client.lists.getListMembersInfo(`${ALL_EMPLOYER_LIST}`, 
                                                                {                                                            
                                                                  "status":"subscribed",
                                                                  "count":1000                                                            
                                                                } 
                                                            )
      //return only the employers' email, full_name, and providr                                                      
      const employers = response.members.map( x => {
        return {
          'email':  x.email_address,
          'full_name': x.merge_fields.MMERGE5,
          'provider': x.merge_fields.MMERGE6
        }
      })  

      employers.forEach( async(x) => {
        await mailchimpClient.messages.sendTemplate({
          template_name: "upcoming-courses",
          template_content: [],
          message: {
            from_email: 'jobs@excelcna.com',                        
            subject: `[Upcoming Caregiver Courses] - CNA, HCA, HCA - CNA bridging, CEUs and other caregiver courses`,                      
            track_opens: true,
            track_clicks: true,
            important: true,
            merge_language: "handlebars",
            merge_vars: [{
                rcpt: x.email,
                vars: [      
                    { name: 'FULL_NAME', content: x.full_name },
                    { name: 'PROVIDER', content: x.provider }                       
                ]
            }],
            to: [
                { email: student.email }
            ]
          }
        })   
      })
      
    } catch (error) {
      console.log(`Error ${error}`)
    }
  },
  //find from employers if they have any job openings
  recentGraduatesNotifications : async () => {
    //get employer list member with subscribe status
    client.setConfig({
      apiKey: MAILCHIMP_API_KEY,
      server: "us4",
    });
    try { 
      //get the employers from mailchimp who are still subscribers
      const response = await client.lists.getListMembersInfo(`${ALL_EMPLOYER_LIST}`, 
                                                                {                                                            
                                                                  "status":"subscribed",
                                                                  "count":1000                                                            
                                                                } 
                                                            )
      //return only the employers' email, full_name, and providr                                                      
      const employers = response.members.map( x => {
        return {
          'email':  x.email_address,
          'full_name': x.merge_fields.MMERGE5,
          'provider': x.merge_fields.MMERGE6
        }
      })  

      employers.forEach( async(x) => {
        await mailchimpClient.messages.sendTemplate({
          template_name: "post-job-openings-for-free",
          template_content: [],
          message: {
            from_email: 'jobs@excelcna.com',                        
            subject: `[Upcoming Caregiver Courses] - CNA, HCA, HCA to CNA bridging, CEUs and other caregiver courses`,                      
            track_opens: true,
            track_clicks: true,
            important: true,
            merge_language: "handlebars",
            merge_vars: [{
                rcpt: x.email,
                vars: [      
                    { name: 'FULL_NAME', content: x.full_name },
                    { name: 'PROVIDER', content: x.provider }                       
                ]
            }],
            to: [
                { email: student.email }
            ]
          }
        })   
      })
      
    } catch (error) {
      console.log(`Error ${error}`)
    }
  }
}


