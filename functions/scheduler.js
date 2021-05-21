const cron = require('node-cron')
const moment = require('moment')

const { notifyEmployers, notifyStudents, upcomingCoursesNotifications } = require('./helpers/notifications')

const scheduler = () => {
    return { 
        
        alertDaily: () => {
            cron.schedule('* * * * *', () => {  // '0 9 * * *'
             
               

                //console.log(`FIRST ${first}`)
                


               
                let second = first.add(8 - first.day(), 'day')
                console.log(`SECOND ${second}`)
                // notifyStudents(15) 
                // notifyEmployers(1)              
            })
        },

        alertWeekly: () => {
            cron.schedule('0 8 * * 1', () => { //'0 8 * * 1'
  
                notifyStudents(7)
                notifyEmployers(7)
            })
        },

        alertFirstMondayNotification: () => {
            cron.schedule("0 8 * * *", async () => { //0 8 * * *              
                //get the first day of the month
                let first = moment().startOf('month')//.add(1, 'month');
                let day = first
                //if the first day is 1 
                if(first.day() === 1 ){

                    const dayOfWeek = moment(day).format('dddd')                
                    //check of day of week is 'Monday'
                    if(dayOfWeek === 'Monday'){
                        //alert the list WHCA lists
                        await alertWHCAEmployers()
                    }
                 
                }
               
                if ( first.day() > 1 ) {       
                 
                    day = first.add(8 - first.day(), 'day')          
              
                    const dayOfWeek = moment(day).format('dddd')
                   
                    //check of day of week
                    if(dayOfWeek === 'Monday'){
                        
                        await alertWHCAEmployers()
                    }
                 
                    //send an email to employers about recruiting our past students,
                }
                if ( day.day() === 0 ) {
                    day = day.add(1, 'days')
                    const dayOfWeek = moment(day).format('dddd')
                    if(dayOfWeek === 'Monday'){
                       
                       await alertWHCAEmployers()
                    }
                }
            })
        }
    }
}

module.exports = scheduler()