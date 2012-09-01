#!/usr/bin/env python

import re
import os
import json
import urllib2
import pickle
import pprint

from flask import Flask
from flask import url_for
from flask import render_template
from flask import request
from flask import jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/LumiDuration', methods=['GET', 'POST'])
def LumiDuration():
    """ Get a list of lumi block durations for the last run

    """
    return GetRunLBInfo()
    

def GetRunLBInfo():
    """ Get a list of the duration of the lumi blocks in the last run

    """
        
    ATLAS_RUN_QUERY_BASE = 'http://atlas-runquery.cern.ch/'

    print "Getting Run Query info from: ", ATLAS_RUN_QUERY_BASE

    #type = request.form['type']
    #if type=='last_run':
    #    QUERY_STRING = 'find+run+last+1+and+events+100000+and+ready+%2F+show+run+and+lumi'
    
    # Get the run number
    run_number = request.form['run_number']
    # last+5+and+ready
    QUERY_STRING = 'find+run+' + run_number + '+%2F+show+events+and+lumi+and+lhc'
    #QUERY_STRING = 'find+run+' + run_number + '+%2F+show+all+and+lumi'

    # Create the request
    try:
        url = ATLAS_RUN_QUERY_BASE + 'query.py?q=' + QUERY_STRING
        print "Fetching info from: %s" % url
        req = urllib2.Request(url)
        res = urllib2.urlopen(req, timeout=60)
        result = res.read()
    except urllib2.URLError:
        print "Error: Unable to fetch info from url %s" % url
        return jsonify(flag=1)

    # Ensure that we selected only 1 run
    reg_expr = '(?<=<tr><td height="10" style="vertical-align: top"><i>No.&nbsp;of&nbsp;runs&nbsp;selected:</i></td><td></td><td valign="top">).*(?=</td></tr>)'
    m = re.search(reg_expr, result)
    num_runs = m.group(0)
    if num_runs != '1':
        print "Error: run number: %s has %s runs!" % (run_number, num_runs)
        return jsonify(lb_duration=[], lb_lumi=[], flag=1)

    # Extract the pickled data url
    reg_expr = '(?<=a href=".).*(?=" target=_blank title="Query results as serialised python dictionary")'
    m = re.search(reg_expr, result)
    pickle_url = m.group(0)

    # Get the pickle string
    url = ATLAS_RUN_QUERY_BASE + pickle_url
    req = urllib2.Request(url)
    res = urllib2.urlopen(req)
    pickle_string = res.read()

    # Find the pickled data string
    result_object = pickle.loads(pickle_string)

    # Loop over runs
    run_list = result_object['Run']
    if len(run_list) != 1:
        print "Error: More than 1 run selected"
        return jsonify(flag=1)
    
    print "Starting Loop Over Runs"
    for run in run_list:
        run_info = result_object[run]        
        #pprint.pprint(run_info)
        #for key in run_info:
        #    print "Key: ", key

        print "Getting Event Info"
        num_events = run_info['#Events'][0]['value']

        print "Getting start and end time"
        (start_time, end_time) = run_info['Start and endtime'].strip().split(',')

        print "Getting Lumi Block duration List"
        num_lb = run_info['#LB'][0]
        lb_list = run_info['#LB'][1]
        lb_duration_list = [lb_list[i+1] - lb_list[i] for i in range(len(lb_list)-1)]

        #print "Getting Integrated Lumi List"
        #lb_lumi_list = [item['value'] for item in run_info['ofllumi:0:OflLumi-8TeV-002']]
        #for item in lb_lumi_list:
        #    if item=='n.a.': item=0.0

        print "Getting Integrated Lumi List"
        stable_list = run_info['ofllumi:0:OflLumi-8TeV-002']
        lb_lumi_list = []
        for item in stable_list:
            if item['accepted'] and item['value']!='n.a.':
                lb_lumi_list.append(item['value'])
            else:
                lb_lumi_list.append(0.0)
            pass

        # The beam energy is a bit complicated
        # Each item gives an energy and a range
        # of lumi blocks.
        # We want to convert this into an ordered
        # list of lb energy values
        print "Getting beam energy"
        run_energy_map = {}
        for item in run_info['lhc:beamenergy']:
            first_lb = item['firstlb']
            last_lb = item['lastlb']
            energy = item['value']
            for lb_number in range(first_lb, last_lb+1):
                run_energy_map[lb_number] = energy
            pass
        run_energy_list=[]
        for lb in range(1, num_lb+1):
            run_energy_list.append(run_energy_map[lb])


        # Same deal for the colliding bunches
        print "Getting colliding bunches"
        bunches_map = {}
        for item in run_info['olc:collbunches']:
            first_lb = item['firstlb']
            last_lb = item['lastlb']
            bunches = item['value']
            for lb_number in range(first_lb, last_lb+1):
                bunches_map[lb_number] = bunches
            pass
        bunches_list=[]
        for lb in range(1, num_lb+1):
            bunches_list.append(bunches_map[lb])

        #bunches_list = [item['value'] for item in run_info['olc:collbunches']]
                
        print "Done with this run"

    print "Completed loop over runs"

    result = jsonify(num_lb=num_lb, num_events=num_events,
                     lb_duration=lb_duration_list, 
                     lb_lumi=lb_lumi_list,
                     run_energy=run_energy_list,
                     bunches=bunches_list,
                     flag=0)
    return result


#def GetRunAttribute(att_name):
#    """ Get a list of attributes from the run object
#
#    """

    


if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
