from flask import Flask, jsonify, request 
from flask_cors import CORS
import numpy as np
import pandas as pd
from kneed import KneeLocator
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import MinMaxScaler
from sklearn.manifold import MDS

app=Flask(__name__)
CORS(app, origins="http://localhost:4200",allow_headers=['Content-Type'])
# CORS(app, resources={r"/reduce_dimensions": {"origins": "http://localhost:4200"}})
file_path = '/Users/sai/Desktop/Ang_test/Demo/src/assets/finalHousing.csv'

df = pd.read_csv(file_path)
original_data = df
columns_to_delete = ["Suburb", "CouncilArea", "SellerG", "Regionname", "Postcode", "Type", "Method", "Address", "Date"]
df.drop(columns=columns_to_delete, inplace=True)
or_data =df

@app.route('/')
def index():
    df = pd.read_csv(file_path)
    columns_to_delete = ["Suburb", "CouncilArea", "SellerG", "Regionname", "Postcode", "Type", "Method", "Address", "Date"]
    df.drop(columns=columns_to_delete, inplace=True)
    X=df
    return "Hello sai" 

@app.route('/mds')
def mds():
    min_max_scaler = MinMaxScaler(feature_range=(-1, 1))
    scaled = min_max_scaler.fit_transform(or_data)
    mds = MDS(n_components=2,dissimilarity='euclidean',  metric=True, random_state=40,normalized_stress='auto') #dissimilarity='euclidean'
    mds1 = mds.fit_transform(scaled) #or_data
    dist_matrix = 1 - np.abs(np.corrcoef(scaled, rowvar=False))
    tmds = MDS(n_components=2, metric=True,dissimilarity='euclidean', random_state=40,normalized_stress='auto')
    mds2 = mds.fit_transform(dist_matrix)
    return  ({'mds_data': mds1.tolist(),'mds_data1': mds2.tolist()})


@app.route('/api/data', methods=['GET'])
def get_data():
    # Logic to fetch data from database or other source
    data = {'key': 'sai'}
    return jsonify(data)

# @app.route('/reduce_dimensions', methods=['POST'])
# def reduce_dimensions():
#     try:
#         X = StandardScaler().fit_transform(df) 
#         # Perform PCA
#         global pca
#         pca = PCA()
#         X_pca = pca.fit_transform(X)
#         min_max_scaler = MinMaxScaler(feature_range=(-1, 1))
#         X_pca_scaled = min_max_scaler.fit_transform(X_pca)
#         eigenvectors = pca.components_.tolist()
#         eigenvalues = pca.explained_variance_.tolist()
#         variance=pca.explained_variance_ratio_.tolist()
#         loadings = pca.components_.T * np.sqrt(pca.explained_variance_)

#         knee_locator = KneeLocator(list(range(1,13)),np.cumsum(variance) , curve='concave', direction='increasing')
#         elbow_point = knee_locator.elbow
#         # print(original_data)

#         return ({'X_pca': X_pca_scaled.tolist(),'eigenvectors': eigenvectors, 'eigenvalues': eigenvalues, 'variance':variance, 'loadings':loadings.tolist(),"elbow_point":int(elbow_point)})
#     except KeyError:
#         return jsonify({'error': 'Data key is missing in JSON payload'}), 400

@app.route('/k-means', methods=['GET']) 
def cluster():
    X = StandardScaler().fit_transform(df)
    min_max_scaler = MinMaxScaler(feature_range=(-1, 1))
    X_scaled = min_max_scaler.fit_transform(df)
    pca = PCA()
    X_pca = pca.fit_transform(X_scaled)#X
    kmeans = KMeans(n_clusters=3, n_init=10, max_iter=300)
    kmeans.fit(X_pca)
    cluster_labels = kmeans.labels_

    columns = list(df.columns)
    
    wcss = []
    cluster_label = []
    for i in range(1, 11):
        kmeans = KMeans(n_clusters=i, init='k-means++', max_iter=300, n_init=10, random_state=0)
        kmeans.fit(X_pca)
        wcss.append(kmeans.inertia_)
        cluster_label.append(kmeans.labels_.tolist())
    

    knee_locator = KneeLocator(list(range(1,11)), wcss, curve='convex', direction='decreasing')
    elbow_point = knee_locator.elbow


    kmeans = KMeans(n_clusters=4, n_init=10, max_iter=300)
    kmeans.fit(X_pca)
    cluster_labels = kmeans.labels_

    return jsonify({'clustered_data': cluster_labels.tolist(), 'wcss': wcss, "columns":columns, "clustered_label":cluster_label,"elbow_point":int(elbow_point)})


# @app.route('/d_index', methods=['POST']) 
# def d_index():
#     global pca
#     data = request.get_json()
#     di=data.get('data')
#     loadings = pca.components_.T * np.sqrt(pca.explained_variance_)
#     squared_sum_loadings = np.sum(loadings[:, :di]**2, axis=1)
#     top_4_attributes_indices = np.argsort(squared_sum_loadings)[-4:]
#     top_4_attributes_indices = top_4_attributes_indices[::-1]
#     attribute_names = df.columns.tolist()
#     attributes = [attribute_names[i] for i in top_4_attributes_indices]
#     attr_values = [squared_sum_loadings[i] for i in top_4_attributes_indices]
#     return jsonify({"attr_values":attr_values, "attributes":attributes,"loadings":loadings.tolist(),"attr_index":top_4_attributes_indices.tolist()})


# @app.route('/d_attributes', methods=['POST']) 
# def d_attributes():
#     global pca
#     data = request.get_json()
#     di=data.get('data')
    
#     loadings = pca.components_.T * np.sqrt(pca.explained_variance_)
#     squared_sum_loadings = np.sum(loadings[:, :di]**2, axis=1)
#     # Select the top 4 attributes with the highest squared sum of loadings
#     top_4_attributes_indices = np.argsort(squared_sum_loadings)[-4:]
#     top_4_attributes_indices = top_4_attributes_indices[::-1]
#     attribute_names = df.columns.tolist()
#     attributes = [attribute_names[i] for i in top_4_attributes_indices]
#     return jsonify({"attributes1":squared_sum_loadings.tolist(), "attributes":attributes,"loadings":loadings.tolist(),"abc":top_4_attributes_indices.tolist()})

if __name__ == "__main__":
    app.run(debug=True)

