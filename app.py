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
    QUERY_STRING = 'find+run+last+5+and+ready+%2F+show+events+and+lumi'

    print "Getting Run Query info from: ", ATLAS_RUN_QUERY_BASE
    
    # Create the request
    url = ATLAS_RUN_QUERY_BASE + 'query.py?q=' + QUERY_STRING
    req = urllib2.Request(url)
    res = urllib2.urlopen(req)
    result = res.read()

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
                     lb_lumi=lb_lumi_list)
    return result



if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
