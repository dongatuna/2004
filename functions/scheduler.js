const cron = require('node-cron')
const moment = require('moment')

const { notifyEmployers, notifyStudents } = require('./helpers/notifications')

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

        alertFirstMondayOfMonth: () => {
            cron.schedule('0 0 1 * *', ()=> {
                //get the
                let first = moment().startOf('month')//.add(1, 'month');
                let day = first;
                if ( first.day() > 1 ) {
                    day = first.add(8 - first.day(), 'day');
                }
                if ( day.day() === 0 ) {
                    day = day.add(1, 'days');
                }
                //format the date of the first Monday of the month
                date = day.format('YYYY-MM-DD'); 
                
                

            })
        }
    }
}

module.exports = scheduler()