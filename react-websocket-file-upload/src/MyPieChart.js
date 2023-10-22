import React, { useEffect, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';

const MyPieChart = ({lastUpdated}) => {
    const [data, setData] = useState([]);  // State to hold the transformed data

    useEffect(() => 
    {
        // Fetch data from Python backend
        fetch('http://localhost:5000/getjson')
            .then(response => response.json())
            .then(jsonData => {
                if(jsonData && jsonData.Categories)
                {
                    // Transform the data
                    const transformedData = Object.keys(jsonData.Categories).map(category => {
                    return {
                    id: category,
                    value: jsonData.Categories[category]["Questions Covered"].length
                };
                });
                // Set the transformed data to state
                setData(transformedData);
                console.log("Transformed Data:", transformedData);
                }
                else
                {
                    console.error('Data does not contain Categories or is malformed:', jsonData);
                }
                
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, [lastUpdated]);  

    // Empty dependency array means this useEffect runs once when the component mounts
    return (
        <div style={{ height: '65vh', width:"auto"}}>
            <ResponsivePie
                data={data}
                margin={{ top: 0, right: 200, bottom: 100, left: 50 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            0.2
                        ]
                    ]
                }}
                enableArcLinkLabels={false}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            2
                        ]
                    ]
                }}
                defs={[
                    {
                        id: 'dots',
                        type: 'patternDots',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        size: 4,
                        padding: 1,
                        stagger: true
                    },
                    {
                        id: 'lines',
                        type: 'patternLines',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10
                    }
                ]}
                fill={[
                    {
                        match: {
                            id: 'ruby'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'c'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'go'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'python'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'scala'
                        },
                        id: 'lines'
                    },
                    {
                        match: {
                            id: 'lisp'
                        },
                        id: 'lines'
                    },
                    {
                        match: {
                            id: 'elixir'
                        },
                        id: 'lines'
                    },
                    {
                        match: {
                            id: 'javascript'
                        },
                        id: 'lines'
                    }
                ]}
                legends={[
                    {
                        anchor: 'right',
                        direction: 'column',
                        justify: false,
                        translateX: -60,
                        translateY: 200,
                        itemsSpacing: 5,
                        itemWidth: -10,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemTextColor: '#000'
                                }
                            }
                        ]
                    }
                ]}
            />
        </div>
    );
};

export default MyPieChart;
