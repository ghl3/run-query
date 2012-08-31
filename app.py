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
    lb_duration = GetRunLBInfo()
    return jsonify(lb_duration=lb_duration)
    

def GetRunLBInfo():
    """ Get a list of the duration of the lumi blocks in the last run

    """
    
    ATLAS_RUN_QUERY_BASE = 'http://atlas-runquery.cern.ch/'
    QUERY_STRING = 'find+run+last+5+and+ready+%2F+show+events'

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
    #pprint.pprint(result_object)

    run_list = result_object['Run']
    for run in run_list:
        run_info = result_object[run]
        event_info = run_info['#Events'][0]
        #print "First LB %s Last LB: %s Total Events: %s" % (event_info['firstlb'], event_info['lastlb'], event_info['value'])
        lb_list = run_info['#LB'][1]
        lb_duration_list = [lb_list[i+1] - lb_list[i] for i in range(len(lb_list)-1)]

    return lb_duration_list

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
