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
    
    # Get the run number
    run_number = request.form['run_number']
    # last+5+and+ready
    QUERY_STRING = 'find+run+' + run_number + '+%2F+show+events+and+lumi'

    # Create the request
    url = ATLAS_RUN_QUERY_BASE + 'query.py?q=' + QUERY_STRING
    req = urllib2.Request(url)
    res = urllib2.urlopen(req)
    result = res.read()

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

    print "Starting loop over runs"
    run_list = result_object['Run']
    for run in run_list:
        run_info = result_object[run]
        print "Getting Event Info"
        event_info = run_info['#Events'][0]
        print "Getting Lumi Block duration List"
        lb_list = run_info['#LB'][1]
        lb_duration_list = [lb_list[i+1] - lb_list[i] for i in range(len(lb_list)-1)]
        print "Getting Integrated Lumi List"
        stable_list = run_info['ofllumi:0:OflLumi-8TeV-002']
        lb_lumi_list = []
        for item in stable_list:
            if item['accepted'] and item['value']!='n.a.':
                lb_lumi_list.append(item['value'])
            else:
                lb_lumi_list.append(0.0)
        print "Done with this run"

    print "Completed loop over runs"

    result = jsonify(lb_duration=lb_duration_list, 
                     lb_lumi=lb_lumi_list,
                     flag=0)
    return result



if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
