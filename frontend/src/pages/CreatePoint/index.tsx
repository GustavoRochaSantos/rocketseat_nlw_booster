import React, {useEffect, useState,  ChangeEvent, FormEvent} from 'react'
import Header from '../../components/Header'
import { Map, TileLayer, Marker, Popup} from 'react-leaflet'
import api from '../../services/api'
import axios from 'axios'
import { LeafletMouseEvent } from 'leaflet'
import './styles.css'
import { useHistory } from 'react-router-dom'

interface Item {
    id: number,
    title: string,
    image_url:string
}
interface IBGEUFs {
    sigla: string
}
interface IBGECities {
    nome: string
}

const CreatePoint = ()=>{
    const history = useHistory()
    const [items, setItems] = useState<Item[]>([])
    const [ufs, setUfs] = useState<string[]>([])
    const [cities, setCities] = useState<string[]>([])
    const [initialPosition, setInitialPosition] = useState<[number,number]>([0,0])
    const [markerPosition, setMarkPosition] = useState<[number, number]>([0,0])
    const [formData, setFormData] = useState({
        name:'',
        email:'',
        whatsapp: '',
        address: '',
        number: 0,
        zipcode:''

    })
    const [selectedUF, setSelectedUF] = useState<string>('0')
    const [selectedCity, setSelectedCity] = useState<string>('0')
    const [selectedItems, setSelectedItems] = useState<number[]>([])
    

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position=>{
            const { latitude, longitude } = position.coords

            setInitialPosition([latitude, longitude])
        })
    }, [])

    useEffect(()=>{
        api.get('items')
            .then(response => setItems(response.data))
            .catch(err => console.error(err))
    })

    useEffect(()=>{
        axios.get<IBGEUFs[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then(response=>{
                const ufsInitials = response.data.map(uf => uf.sigla).sort()

                setUfs(ufsInitials)
            })
    }, [])

    useEffect(()=>{
        axios.get<IBGECities[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
        .then(response=>{
            const cities = response.data.map(city => city.nome).sort()

            setCities(cities)
        })

    }, [selectedUF])

    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value

        setSelectedUF(uf)
    }
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value

        setSelectedCity(city)
    }
    function handleMapClick(event: LeafletMouseEvent){
        const { lat, lng } = event.latlng
        setMarkPosition([lat, lng])

    }
    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value} = event.target

        setFormData({...formData, [name]:value})
    }
    function handleSubmit(event: FormEvent){
        event.preventDefault()

        const { name, email, whatsapp, address, number, zipcode} = formData
        const city = selectedCity
        const uf = selectedUF
        const [latitude, longitude] = markerPosition
        const items = selectedItems
        const image = 'fakeimg'

        const data = { 
            name, 
            email, 
            whatsapp, 
            city,
            uf,
            latitude, 
            longitude,
            image,
            address, 
            number,
            zipcode,
            items
        }

        api.post('points', data)
            .then(response => history.push('/completed'))
            .catch(err => console.error(err))
    }
    function handleItemClick(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id)

        if(alreadySelected >=0){
            const newItems = selectedItems.filter(item => item !== id)
            setSelectedItems(newItems)
        } else
            setSelectedItems([...selectedItems, id])
    }
    return(
        <div id="page-create-point">
            <Header link="/" linkText="Voltar para home"/>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da Entidade</label>
                        <input 
                            type="text"
                            id="name"
                            name="name"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input 
                                type="email"
                                id="email"
                                name="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input 
                                type="text"
                                id="whatsapp"
                                name="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereços</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                    <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'  
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={markerPosition}>
                            <Popup>
                                A pretty CSS3 popup. <br /> Easily customizable.
                            </Popup>
                        </Marker>/>
                    </Map>
                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select id="uf" name="uf" value={selectedUF} onChange={handleSelectUF}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select id="city" name="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city =>(
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                        
                    </div>
                    <div className="field">
                        <label htmlFor="address">Endereço</label>
                        <input 
                            type="text"
                            id="address"
                            name="address"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="number">Número</label>
                            <input 
                                type="number"
                                id="number"
                                name="number"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="zipcode">CEP</label>
                            <input 
                                type="text"
                                id="zipcode"
                                name="zipcode"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Itens de Coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={()=>handleItemClick(item.id)}
                                className={ selectedItems.includes(item.id) ? 'selected': ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint